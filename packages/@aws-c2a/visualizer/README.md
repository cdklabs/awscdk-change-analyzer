# AWS CDK Change Analyzer (C2A) - Visualizer

`@aws-c2a/visualizer` is a package that generates a web app to help visualize your
C2A diff tree. We built `@aws-c2a/visualizer` to help with developing `@aws-c2a/presets`
and understand the state of the C2A diff tree.

**Note**: `@aws-c2a/visualizer` currently only support single template comparisons.

## Usage

We recommend using the [`aws-c2a`](https://npmjs.com/package/aws-c2a) CLI to run the
visualizer. However, if you wish to interact directly with the package itself check
out the [integration](#integration) section below.

Nodes and edges in the visualizer reflect nodes and edges in the C2A diff tree. You can use the
visualizer to help better understand the rules language. The visualizer can help you pinpoint 
query-able properties through the inspect window.

You can also use the visualizer to understand relationships between properties and their resources. 
For example, creating a new resource will incur a `InsertComponentOperation`, however this will not
trigger any operations on the property themselves. So you can't specifically query for new properties
through `{ "propertyOperationType": "INSERT" }`. Behavior like these are easier to spot with the 
help of the visualizer!

## Integration 

To use the visualizer in a **production** environment:

1. Install the `@aws-c2a/visualizer` package
    ```
    yarn add @aws-c2a/visualizer
    ```

2. Import package and obtain the path to the template file
    ```ts
    const templatePath = require(resolve('@aws-c2a/visualizer/fixtures/template.index.html'));
    const template = await fs.promises.readFile(templatePath, 'utf-8');
    ```

3. Replace the placeholder values in the template file with stringified CloudFormation Templates
    ```ts
    const visualizer = template
      .replace('"!!!CDK_CHANGE_ANALYSIS_BEFORE"', before)
      .replace('"!!!CDK_CHANGE_ANALYSIS_AFTER"', after);
    ```

To use the visualizer in a **developer** environment:

1. First install and build all packages.
    ```
    git clone https://github.com/cdklabs/awscdk-change-analyzer.git
    cd awscdk-change-analyzer
    yarn install
    yarn build
    cd packages/@aws-c2a/visualizer
    ```

2. Then create the necessary data files (both CloudFormation templates) for testing.
    ```
    mkdir data
    touch data/before.json data/after.json
    ```

3. Now you can start developing with `@aws-c2a/visualizer` running locally.
    ```
    yarn dev
    ```
