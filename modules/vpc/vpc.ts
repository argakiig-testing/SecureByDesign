/**
 * VPC Component Implementation
 * Creates a secure, production-ready VPC with public/private subnets, NAT gateway, and proper routing
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { VpcArgs, VpcOutputs } from './types';
import { VPC_DEFAULTS, DEFAULT_TAGS, calculateSubnetCidrs } from './defaults';

/**
 * VPC Component - Creates a secure, multi-AZ VPC with public and private subnets
 *
 * Features:
 * - Public subnets with Internet Gateway for load balancers/bastion hosts
 * - Private subnets with NAT Gateway for secure outbound access
 * - Proper route tables and security groups
 * - All resources tagged for auditing and cost tracking
 * - Follows AWS Well-Architected Framework principles
 */
export class VpcComponent extends pulumi.ComponentResource implements VpcOutputs {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: readonly aws.ec2.Subnet[];
  public readonly privateSubnets: readonly aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: readonly aws.ec2.NatGateway[] | undefined;
  public readonly routeTables: {
    readonly public: aws.ec2.RouteTable;
    readonly private: readonly aws.ec2.RouteTable[];
  };
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: readonly pulumi.Output<string>[];
  public readonly privateSubnetIds: readonly pulumi.Output<string>[];

  constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super('modinfra:vpc:VpcComponent', name, {}, opts);

    // Merge user args with secure defaults and resolve Input types
    const config = { ...VPC_DEFAULTS, ...args };
    const tags = { ...DEFAULT_TAGS, ...config.tags };
    const azCount = config.availabilityZoneCount as number;
    const cidrBlock = config.cidrBlock as string;

    // Get available AZs for the region
    const availableAZs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create fallback AZ names for LocalStack compatibility
    const getAvailabilityZone = (index: number): pulumi.Output<string> => {
      return pulumi.output(availableAZs).apply(azs => {
        if (azs.names && azs.names.length > index && azs.names[index]) {
          return azs.names[index];
        }
        // Fallback for LocalStack or regions with fewer AZs
        // Use a default region pattern
        return `us-east-1${String.fromCharCode(97 + index)}`; // us-east-1a, us-east-1b, etc.
      });
    };

    // Create the VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: config.cidrBlock,
        enableDnsHostnames: config.enableDnsHostnames,
        enableDnsSupport: config.enableDnsSupport,
        tags: {
          ...tags,
          Name: `${name}-vpc`,
        },
      },
      { parent: this }
    );

    this.vpcId = this.vpc.id;

    // Calculate subnet CIDRs
    const subnetCidrs = calculateSubnetCidrs(cidrBlock, azCount);

    // Create Internet Gateway for public subnets
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `${name}-igw`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const publicSubnetIds: pulumi.Output<string>[] = [];

    for (let i = 0; i < azCount; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrs.publicSubnets[i]!,
          availabilityZone: getAvailabilityZone(i),
          mapPublicIpOnLaunch: true, // Auto-assign public IPs
          tags: {
            ...tags,
            Name: `${name}-public-${i}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
      publicSubnetIds.push(subnet.id);
    }

    this.publicSubnets = publicSubnets;
    this.publicSubnetIds = publicSubnetIds;

    // Create private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateSubnetIds: pulumi.Output<string>[] = [];

    for (let i = 0; i < azCount; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrs.privateSubnets[i]!,
          availabilityZone: getAvailabilityZone(i),
          mapPublicIpOnLaunch: false, // No public IPs for private subnets
          tags: {
            ...tags,
            Name: `${name}-private-${i}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
      privateSubnetIds.push(subnet.id);
    }

    this.privateSubnets = privateSubnets;
    this.privateSubnetIds = privateSubnetIds;

    // Create NAT Gateways (if enabled and we have public subnets)
    let natGateways: aws.ec2.NatGateway[] | undefined;
    if (config.enableNatGateway && azCount > 0 && publicSubnets.length > 0) {
      natGateways = [];
      const natCount = config.multiAzNatGateway ? azCount : 1;

      for (let i = 0; i < natCount; i++) {
        // Create Elastic IP for NAT Gateway
        const eip = new aws.ec2.Eip(
          `${name}-nat-eip-${i}`,
          {
            domain: 'vpc',
            tags: {
              ...tags,
              Name: `${name}-nat-eip-${i}`,
            },
          },
          { parent: this }
        );

        // Create NAT Gateway in public subnet
        const subnetIndex = Math.min(i, publicSubnets.length - 1);
        const natGateway = new aws.ec2.NatGateway(
          `${name}-nat-${i}`,
          {
            allocationId: eip.id,
            subnetId: publicSubnets[subnetIndex]!.id,
            tags: {
              ...tags,
              Name: `${name}-nat-${i}`,
            },
          },
          { parent: this, dependsOn: [this.internetGateway] }
        );

        natGateways.push(natGateway);
      }
    }

    this.natGateways = natGateways;

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `${name}-public-rt`,
        },
      },
      { parent: this }
    );

    // Route to Internet Gateway for public subnets
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create route tables for private subnets
    const privateRouteTables: aws.ec2.RouteTable[] = [];

    privateSubnets.forEach((subnet, i) => {
      const routeTable = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `${name}-private-rt-${i}`,
          },
        },
        { parent: this }
      );

      // Route to NAT Gateway for internet access (if NAT is enabled)
      if (natGateways && natGateways.length > 0) {
        const natIndex = config.multiAzNatGateway ? i : 0;
        new aws.ec2.Route(
          `${name}-private-route-${i}`,
          {
            routeTableId: routeTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[natIndex]!.id,
          },
          { parent: this }
        );
      }

      // Associate private subnet with its route table
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );

      privateRouteTables.push(routeTable);
    });

    this.routeTables = {
      public: publicRouteTable,
      private: privateRouteTables,
    };

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
