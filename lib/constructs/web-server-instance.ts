import { CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { readFileSync } from "fs";

// Construct propsを定義
export interface WebServerInstanceProps {
  readonly vpc: ec2.IVpc
}

// EC2インスタンスを含むConstructを定義
export class WebServerInstance extends Construct {
  // 外部からインスタンスへアクセスできるように設定
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: WebServerInstanceProps) {
    super(scope, id);

    // Construct props から vpc を取り出す
    const { vpc } = props;

    const instance = new ec2.Instance(this, "Instance", {
      // EC2 インスタンスを起動する VPC を設定
      vpc,
      // t2.small インスタンスタイプを指定
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      // AmazonLinuxImage インスタンスを生成し、AMI を設定
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      // EC2 インスタンスを配置するサブネットを指定
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // user-data.sh を読み込み、変数に格納
    const script = readFileSync("./lib/resources/user-data.sh", "utf8");
    // EC2 インスタンスにユーザーデータを追加(インスタンスのメソッドを呼び出し)
    instance.userData.addCommands(script);

    // port80, 全ての IP アドレスからのアクセスを許可(インスタンスのメソッドを呼び出し)
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    // 作成した EC2 インスタンスをプロパティに設定
    this.instance = instance;
    
    // インスタンスのパブリック IP を含む URL を出力
    new CfnOutput(this, "WordpressServer1PublicIPAddress", {
      value: `http://${instance.instancePublicIp}`,
    });
  }
}
