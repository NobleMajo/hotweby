# hotweby

![CI/CD](https://github.com/noblemajo/hotweby/actions/workflows/npm-publish.yml/badge.svg)
![MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![typescript](https://img.shields.io/badge/dynamic/json?style=plastic&color=blue&label=Typescript&prefix=v&query=devDependencies.typescript&url=https%3A%2F%2Fraw.githubusercontent.com%2Fnoblemajo%2Fhotweby%2Fmain%2Fpackage.json)
![npm](https://img.shields.io/npm/v/hotweby.svg?style=plastic&logo=npm&color=red)
<!-- ![github](https://img.shields.io/badge/dynamic/json?style=plastic&color=darkviolet&label=GitHub&prefix=v&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Fnoblemajo%2Fhotweby%2Fmain%2Fpackage.json) -->

![](https://img.shields.io/badge/dynamic/json?color=green&label=watchers&query=watchers&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fnoblemajo%2Fhotweby)
![](https://img.shields.io/badge/dynamic/json?color=yellow&label=stars&query=stargazers_count&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fnoblemajo%2Fhotweby)
![](https://img.shields.io/badge/dynamic/json?color=navy&label=forks&query=forks&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fnoblemajo%2Fhotweby)
<!-- ![](https://img.shields.io/badge/dynamic/json?color=darkred&label=open%20issues&query=open_issues&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fnoblemajo%2Fhotweby)
![](https://img.shields.io/badge/dynamic/json?color=orange&label=subscribers&query=subscribers_count&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fnoblemajo%2Fhotweby) -->

Automatic hot-reloading webserver based on a file watcher, a websocket server, a id endpoint and a html injected javascript function.

- [hotweby](#hotweby)
- [Getting started](#getting-started)
  - [Global install](#global-install)
  - [Show help](#show-help)
  - [Run as webserver](#run-as-webserver)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

----

# Getting started

## Global install
```sh
npm i hotweby
```

## Show help
```sh
hotweby --help
```

```js
Usage: hotweby [options]

Automatic multiway hot-reloading webserver

Options:
  -V, --version               output the version number
  -p, --port <number>         hot reload server port (env: SERVE_PORT)
  -d, --dir <string>          target dir (default: ".", env: SERVE_PATH)
  -i, --id-endpoint <string>  id endpoint (default: "/noblemajo-serve-id", env: SERVE_ID_ENDPOINT)
  -h, --help                  display help for command
```

## Run as webserver
```sh
hotweby -p 8080 -d html
```

# Contributing
Contributions to this project are welcome!  
Interested users can refer to the guidelines provided in the [CONTRIBUTING.md](CONTRIBUTING.md) file to contribute to the project and help improve its functionality and features.

# License
This project is licensed under the [MIT license](LICENSE), providing users with flexibility and freedom to use and modify the software according to their needs.

# Disclaimer
This project is provided without warranties.  
Users are advised to review the accompanying license for more information on the terms of use and limitations of liability.
