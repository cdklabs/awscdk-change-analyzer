describe('Traverse on real data', () => {
  // GIVEN
  let host: DefaultC2AHost;
  beforeAll(() => {
    host = new DefaultC2AHost();
  });

  test('runs on cloudformation', async () => {
    const rawAsm = new cxapi.CloudAssembly(path.resolve(__dirname, 'cdk.out'));
    const asm = new CloudAssembly(rawAsm);
    const stacks = await asm.selectStacks({allTopLevel: true, patterns: []},{
      extend: ExtendedStackSelection.Upstream,
      defaultBehavior: DefaultSelection.MainAssembly,
    });
    const traverser = new CfnTraverser(host, asm);

    const localOutput = await traverser.traverseLocal(stacks.stackArtifacts[0].templateFile);
    const cfnOutput = await traverser.traverseCfn(stacks.stackArtifacts[0].stackName);

    expect(localOutput).toEqual(cfnOutput);
  });
});