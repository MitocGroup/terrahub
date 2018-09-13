# aws_lb

Provides a Load Balancer resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_name|The name of the LB. This name must be unique within your AWS account, can have a maximum of 32 characters, must contain only alphanumeric characters or hyphens, and must not begin or end with a hyphen. If not specified, Terraform will autogenerate a name beginning with tf-lb.|string|{{ name }}|No|
|lb_internal|If true, the LB will be internal.|boolean|false|No|
|lb_load_balancer_type|The type of load balancer to create. Possible values are application or network. The default value is application.|string|network|No|
|lb_subnets| A list of subnet IDs to attach to the LB. Subnets cannot be updated for Load Balancers of type network. Changing this value for load balancers of type network will force a recreation of the resource.|list||Yes|
|lb_enable_deletion_protection| If true, deletion of the load balancer will be disabled via the AWS API. This will prevent Terraform from deleting the load balancer.|boolean|false|No|
|lb_enable_cross_zone_load_balancing|If true, cross-zone load balancing of the load balancer will be enabled. This is a network load balancer feature.|boolean|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ARN of the load balancer (matches arn).|string|
|thub_id|The ARN of the load balancer (hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The ARN of the load balancer (matches id).|string|
|arn_suffix|The ARN suffix for use with CloudWatch Metrics.|string|
|dns_name|The DNS name of the load balancer.|string|
|canonical_hosted_zone_id|The canonical hosted zone ID of the load balancer.|string|
|zone_id|The canonical hosted zone ID of the load balancer (to be used in a Route 53 Alias record).|string|