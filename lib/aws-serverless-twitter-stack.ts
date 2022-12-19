import * as cdk from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import {
  Cluster,
  ContainerImage,
  CpuArchitecture,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  NetworkMode,
  OperatingSystemFamily,
  Secret,
} from "aws-cdk-lib/aws-ecs";
import { EventBus } from "aws-cdk-lib/aws-events";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { join } from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsServerlessTwitterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bus = new EventBus(this, "bus", {
      eventBusName: "TweetEventBus",
    });

    // const cluster = new Cluster(this, "Cluster", {
    //   enableFargateCapacityProviders: true,
    // });

    const cluster = Cluster.fromClusterAttributes(this, "DiscordCluster", {
      clusterName: "discord-bot-police",
      securityGroups: [
        SecurityGroup.fromLookupById(this, "SG", "sg-0633e00c9c79af8dc"),
      ],
      vpc: Vpc.fromLookup(this, "VPC", {
        vpcId: "vpc-b05c7dd7",
      }),
    });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      runtimePlatform: {
        operatingSystemFamily: OperatingSystemFamily.LINUX,
        cpuArchitecture: CpuArchitecture.ARM64,
      },
      cpu: 256,
      memoryLimitMiB: 512,
    });
    bus.grantPutEventsTo(taskDefinition.taskRole);

    const asset = new DockerImageAsset(this, "MyBuildImage", {
      directory: join(__dirname, "listener"),
      platform: Platform.LINUX_ARM64,
    });

    const bearerToken = StringParameter.fromSecureStringParameterAttributes(
      this,
      "BearerToken",
      {
        parameterName: "twitter-bearer-token",
      }
    );

    const container = taskDefinition.addContainer("twitter-listener", {
      containerName: "twitter-listener-container",
      image: ContainerImage.fromDockerImageAsset(asset),
      environment: {
        EVENT_BUS_ARN: bus.eventBusArn,
      },
      logging: LogDrivers.awsLogs({ streamPrefix: "TwitterListener" }),
    });
    container.addSecret("BEARER_TOKEN", Secret.fromSsmParameter(bearerToken));

    new FargateService(this, "FargateService", {
      cluster,
      taskDefinition,
      serviceName: "twitter-listener",
      assignPublicIp: true,
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE",
          weight: 1,
        },
      ],
    });
  }
}
