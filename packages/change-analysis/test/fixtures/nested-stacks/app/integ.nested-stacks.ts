import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';

class BaseResources extends cdk.NestedStack {
  public readonly vpc:  ec2.Vpc;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'MyAppVpc', {
      cidr: '10.0.0.0/20',
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 22,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 22,
          name: 'private',
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'MyAppSecuritygroup', {
      vpc: this.vpc,
      securityGroupName: 'AppSecurityGroup',
    });

    this.appSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
  }
}

class InnerStack extends cdk.NestedStack {
  constructor(scope: cdk.Construct, id: string, props: cdk.NestedStackProps) {
    super(scope, id, props);

    // Change should be renaming this to MyNewTopic
    new sns.Topic(this, 'MyNewTopic');
  }
}

interface AppResourcesProps extends cdk.NestedStackProps {
  readonly vpc:  ec2.Vpc;
  readonly appSecurityGroup: ec2.SecurityGroup;
}

class AppResources extends cdk.NestedStack {
  constructor(scope: cdk.Construct, id: string, props: AppResourcesProps) {
    super(scope, id, props);

    const instance = new ec2.Instance(this, 'MyServer', {
      vpc: props?.vpc,
      instanceName: 'MyServer',
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.appSecurityGroup,
    });

    instance.addUserData(
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html',
    );

    instance.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
    );

    new InnerStack(this, 'InnerStack', props);
  }
}

class App extends cdk.Stack {
  public readonly base: BaseResources;
  public readonly app: AppResources;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.base = new BaseResources(this, 'BaseResources');
    const { vpc, appSecurityGroup } = this.base;

    this.app = new AppResources(this, 'AppResources', {
      vpc,
      appSecurityGroup,
    });

    this.app.addDependency(this.base);
  }
}

const app = new cdk.App({
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': 'true',
  },
});
new App(app, 'NestedStackApp', {});

app.synth();
