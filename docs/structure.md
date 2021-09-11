# Repository Structure

AWS C2A is supported through multiple interconnected packages. These packages are
managed with the help of [lerna](https://github.com/lerna/lerna). The packages are
located in the `packages` folder and contain:

Packages                                | Description
----------------------------------------|---------------------------------------------------------------------------
[**aws-c2a**][cli]                      | The toolkit/CLI to run the engine, visualizer, and web app
[**@aws-c2a/cdk-pipelines-step**][step] | A CDK construct that integrates C2A into a CDK Pipelines step
[**@aws-c2a/engine**][engine]           | Rules parsing, template parsing, and model diffing
[**@aws-c2a/models**][models]           | Class definitions and serialization logic for the building blocks of C2A
[**@aws-c2a/presets**][presets]         | A predefined set of rules for the C2A toolkit and its consumers
[**@aws-c2a/rules**][rules]             | Definition for the rules language, along with an object model.
[**@aws-c2a/visualizer**][visualizer]   | A web app to help vizualize the C2A diff tree.
[**@aws-c2a/web-app**][web-app]         | A web app for visualizing and interacting with a produced change report.

[cli]: ../packages/aws-c2a/README.md
[step]: ../packages/@aws-c2a/cdk-pipelines-step/README.md
[engine]: ../packages/@aws-c2a/engine/README.md
[models]: ../packages/@aws-c2a/models/README.md
[presets]: ../packages/@aws-c2a/presets/README.md
[rules]: ../packages/@aws-c2a/rules/README.md
[visualizer]: ../packages/@aws-c2a/visualizer/README.md
[web-app]: ../packages/@aws-c2a/web-app/README.md