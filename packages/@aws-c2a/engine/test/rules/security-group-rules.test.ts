import { InfraModel, OperationType } from '@aws-c2a/models';
import { CFParser } from '../../lib/platform-mapping';
import { copy } from '../../lib/private/object';
import { behavior, THEN_expectResource, THEN_expectProperty } from '../utils';

const BEFORE: Record<any, any> = {
  Resources: {
    SecurityGroup: {
      Type: 'AWS::EC2::SecurityGroup',
      Properties: {
        SecurityGroupEgress: [ { CidrIp: '0.0.0.0/0', IpProtocol: '-1' } ],
        SecurityGroupIngress: [ { CidrIp: '0.0.0.0/0', IpProtocol: '-1' } ],
      },
    },
  },
};

let oldModel: InfraModel;
beforeAll(() => {
  oldModel = new CFParser('root', BEFORE).parse();
});

describe('EC2 Security Group default rules', () => {
  behavior('with new Security Group resource with property, security group', (suite) => {
    suite.egress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupEgress');
      THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: '0.0.0.1/0'}]);
    });

    suite.ingress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupIngress');
      THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: '0.0.0.1/0'}]);
    });

    function GIVEN(path: string) {
      const before: Record<any, any> = { Resources: {} };
      const after = copy(before);
      after.Resources.SecurityGroup = {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: { [path]: { CidrIp: '0.0.0.1/0', IpProtocol: '-1' } },
      };
      return {after, _oldModel: new CFParser('root', before).parse()};
    }
  });

  behavior('with full additions to security group property', (suite) => {
    suite.egress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupEgress');
      THEN_expectProperty(after, _oldModel, OperationType.INSERT, [{value: '-1'}, {value: '0.0.0.1/0'}]);
    });

    suite.ingress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupIngress');
      THEN_expectProperty(after, _oldModel, OperationType.INSERT, [{value: '-1'}, {value: '0.0.0.1/0'}]);
    });

    function GIVEN(path: string) {
      const after = copy(BEFORE);
      after.Resources.SecurityGroup.Properties[path].push({ CidrIp: '0.0.0.1/0', IpProtocol: '-1' });
      return {after, _oldModel: oldModel};
    }
  });

  behavior('with updates to security group property', (suite) => {
    suite.egress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupEgress');
      THEN_expectProperty(after, _oldModel, OperationType.UPDATE, [{value: '0.0.0.1/0'}]);
    });

    suite.ingress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupIngress');
      THEN_expectProperty(after, _oldModel, OperationType.UPDATE, [{value: '0.0.0.1/0'}]);
    });

    function GIVEN(path: string) {
      const after = copy(BEFORE);
      after.Resources.SecurityGroup.Properties[path][0].CidrIp = '0.0.0.1/0';
      return {after, _oldModel: oldModel};
    }
  });

  behavior('with removals to security group property', (suite) => {
    suite.egress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupEgress');
      THEN_expectProperty(after, _oldModel, OperationType.REMOVE, [{value: '0.0.0.0/0'}]);
    });

    suite.ingress(() => {
      const {after, _oldModel} = GIVEN('SecurityGroupIngress');
      THEN_expectProperty(after, _oldModel, OperationType.REMOVE, [{value: '0.0.0.0/0'}]);
    });

    function GIVEN(path: string) {
      const after = copy(BEFORE);
      after.Resources.SecurityGroup.Properties[path] = [];
      return {after, _oldModel: oldModel};
    }
  });
});

describe('AWS::EC2::SecurityGroupXxx', () => {
  behavior('with new resource security group', (suite) => {
    suite.egress(() => {
      const resource = 'AWS::EC2::SecurityGroupEgress';
      const {after, _oldModel} = GIVEN(resource);
      THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: '123456789'}]);
    });

    suite.ingress(() => {
      const resource = 'AWS::EC2::SecurityGroupIngress';
      const {after, _oldModel} = GIVEN(resource);
      THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: '123456789'}]);
    });

    function GIVEN(resource: string) {
      const id = resource.replace(/::/g, '');
      const after = copy(BEFORE);
      after.Resources[id] = {
        Type: resource,
        Properties: {
          GroupId: '123456789',
          IpProtocol: 'tcp',
        },
      };

      return { after, _oldModel: oldModel };
    }
  });

  behavior('with updates to resource security group', (suite) => {
    suite.egress(() => {
      const resource = 'AWS::EC2::SecurityGroupEgress';
      const {after, _oldModel} = GIVEN(resource);
      THEN_expectProperty(after, _oldModel, OperationType.UPDATE, [{value: 'abcdefghi'}]);
    });

    suite.ingress(() => {
      const resource = 'AWS::EC2::SecurityGroupIngress';
      const {after, _oldModel} = GIVEN(resource);
      THEN_expectProperty(after, _oldModel, OperationType.UPDATE, [{value: 'abcdefghi'}]);
    });

    function GIVEN(resource: string) {
      const id = resource.replace(/::/g, '');
      const before = copy(BEFORE);
      before.Resources[id] = {
        Type: resource,
        Properties: {
          GroupId: '123456789',
          IpProtocol: 'tcp',
        },
      };
      const _oldModel = new CFParser('root', before).parse();
      const after = copy(before);
      after.Resources[id].Properties.GroupId = 'abcdefghi';

      return { after, _oldModel };
    }
  });

  behavior('with removals to resource security group', (suite) => {
    suite.egress(() => {
      const resource = 'AWS::EC2::SecurityGroupEgress';
      const {after, _oldModel} = GIVEN(resource);
      THEN_expectResource(after, _oldModel, OperationType.REMOVE, [{value: '123456789'}]);
    });

    suite.ingress(() => {
      const resource = 'AWS::EC2::SecurityGroupIngress';
      const {after, _oldModel} = GIVEN(resource);
      THEN_expectResource(after, _oldModel, OperationType.REMOVE, [{value: '123456789'}]);
    });

    function GIVEN(resource: string) {
      const id = resource.replace(/::/g, '');
      const before = copy(BEFORE);
      before.Resources[id] = {
        Type: resource,
        Properties: {
          GroupId: '123456789',
          IpProtocol: 'tcp',
        },
      };
      const _oldModel = new CFParser('root', before).parse();

      return { after: BEFORE, _oldModel };
    }
  });
});