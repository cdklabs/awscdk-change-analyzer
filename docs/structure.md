# Repository Structure

This repository contains multiple packages managed with [lerna](https://github.com/lerna/lerna). The packages are located in the `packages` folder and contain:

Packages                                  | Description
------------------------------------------|------------------------------------------------------------------
[**aws-c2a**](packages/aws-c2a/README.md) | Contains the toolkit/CLI to run the engine, visualizer, and web app
[**@aws-c2a/cdk-pipelines-step**](packages/@aws-c2a/cdk-pipelines-step/README.md) | Contains
[**@aws-c2a/engine**](packages/@aws-c2a/engine/README.md) | Contains all logic related to change analysis and creating a report of those changes.
[**@aws-c2a/models**](packages/@aws-c2a/models/README.md) | Contains class definitions and serialization logic for the building blocks of C2A
[**@aws-c2a/presets**](packages/@aws-c2a/presets/README.md) | Contains
[**@aws-c2a/rules**](packages/@aws-c2a/rules/README.md) | Contains
[**@aws-c2a/visualizer**](packages/@aws-c2a/visualizer/README.md) | Contains
[**@aws-c2a/web-app**](packages/@aws-c2a/web-app/README.md) | Contains a web application for visualizing and interacting with a produced change report.

![c2a - architecture](https://user-images.githubusercontent.com/26902818/124084162-9e19f800-da46-11eb-9c22-42b8f1cf1882.png)
