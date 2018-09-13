# aws_db_subnet_group

Provides an RDS DB subnet group resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|db_subnet_group_name|The name of the DB subnet group. If omitted, Terraform will assign a random, unique name.|string|{{ name }}|No|
|db_subnet_group_description|The description of the DB subnet group.|string|Managed by TerraHub|No|
|db_subnet_group_subnet_ids|A list of VPC subnet IDs|list||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The db subnet group name.|string|
|thub_id|The db subnet group name (hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The ARN of the db subnet group.|string|