var commander = require("commander");
var chalk = require("chalk");
var fs = require("fs");

var Progress = require("progress"),
  // [:bar] = progress bar, :percent = percentage %, :etas = Time has been spent
  bar = new Progress("running [:bar] :percent :etas", {
    // complete = Character which will goes in progress bar due to the completeness of the progress
    complete: "=",
    // opposite of the complete option.
    incomplete: " ",
    // Total size of progress bar
    width: 20,
    // total numbers of tick
    total: 1
  });

exports.docker_setup = function() {
  commander
    .arguments("<framework>")
    .option("-n, --name <name>", "Container name you want to use.")
    .option(
      "-p, --port <port>",
      "Port binding to connect container with your local server. ex> 16400"
    )
    .action(function(framework) {
      var start_command = null;

      switch (framework) {
        case "vue":
          var dockerImage = "lopun/vue-web-base:0.1";
          start_command = `#! /bin/bash\ncd /home/app\nyarn\nyarn build\ncd /home/app/nginx_conf\ncp nginx.conf /etc/nginx/sites-available/nginx.conf\ncd /etc/nginx/sites-enabled\nln -s /etc/nginx/sites-available/nginx.conf nginx.conf\nservice nginx start\n`;
          break;

        case "react":
          var dockerImage = "lopun/react-web-base:0.1";
          start_command = `#!/bin/bash\ncd /home/app\nyarn\nyarn start &\n/bin/bash\n`;
          break;

        default:
          console.error(
            chalk.red("Please give a framework between vue or react!")
          );
      }

      const port = commander.port;
      const name = commander.name;

      const nameoption = name ? "--name " + name : "--name auto-docker-app";
      const portoption = port
        ? `-p ${port}${framework == "react" ? ":3000" : ":8000"}`
        : "";

      const nginx_conf = `server {\n
  listen 8000;\n
  listen [::]:8000;\n
  root /home/zabo/zabo-web/dist;\n
  index index.html;\n
  server_name _;\n
  location / {\n
    try_files $uri $uri/ /index.html;\n
  }\n
  location ~* \.(?:ico|css|js|gif|jpe?g|png)$ {\n
    expires max;\n
    add_header Pragma public;\n
    add_header Cache-Control "public, must-revalidate, proxy-revalidate";\n
  }\n
}`;

      var docker_command = `#!/bin/bash\n
cd ..\n
docker run -it ${nameoption} ${portoption} -v \${pwd}:/home/app ${dockerImage}\n
docker exec -it ${
        name ? name : "auto-docker-app"
      } /home/app/docker_config/start_up.sh`;

      fs.existsSync("docker_config") || fs.mkdirSync("docker_config");

      fs.writeFile(
        "./docker_config/docker_run.sh",
        docker_command,
        "utf-8",
        function(e) {
          if (e) {
            console.log(chalk.red(e));
          } else {
            console.log(chalk.green("Docker commands successfully added!"));
          }
        }
      );

      fs.writeFile(
        "./docker_config/start_up.sh",
        start_command,
        "utf-8",
        function(e) {
          if (e) {
            console.log(chalk.red(e));
          } else {
            console.log(
              chalk.green("Startup commands in container successfully added!")
            );
          }
        }
      );
      if (framework == "vue") {
        fs.existsSync("nginx_config") || fs.mkdirSync("nginx_config");
        fs.writeFile("./nginx_config/nginx.conf", nginx_conf, "utf-8", function(
          e
        ) {
          if (e) {
            console.log(chalk.red(e));
          } else {
            console.log(
              chalk.green("Nginx config for vue successfully added!")
            );
          }
        });
      }
      bar.tick();
    })
    .parse(process.argv);
};
