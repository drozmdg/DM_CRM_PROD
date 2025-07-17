# Auto Scaling Configuration
# DM_CRM Sales Dashboard - Production Infrastructure

# Launch Template for Backend Application Servers
resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project_name}-backend-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.app_instance_type
  key_name      = var.key_pair_name
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data/backend.sh", {
    project_name        = var.project_name
    environment         = var.environment
    docker_image        = var.docker_image_backend
    database_url        = "postgresql://${aws_db_instance.main.username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
    jwt_secret          = var.jwt_secret
    node_env           = var.node_env
    app_port           = var.app_port
    jwt_expires_in     = var.jwt_expires_in
    jwt_refresh_expires_in = var.jwt_refresh_expires_in
  }))
  
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      throughput  = 125
      iops        = 3000
      encrypted   = true
    }
  }
  
  monitoring {
    enabled = var.enable_detailed_monitoring
  }
  
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-backend-${var.environment}"
      Type        = "Backend"
      Environment = var.environment
      Project     = var.project_name
    }
  }
  
  tags = {
    Name = "${var.project_name}-backend-lt-${var.environment}"
  }
}

# Launch Template for Frontend Web Servers
resource "aws_launch_template" "frontend" {
  name_prefix   = "${var.project_name}-frontend-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.web_instance_type
  key_name      = var.key_pair_name
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data/frontend.sh", {
    project_name    = var.project_name
    environment     = var.environment
    docker_image    = var.docker_image_frontend
    backend_endpoint = aws_lb.main.dns_name
    app_port        = var.app_port
  }))
  
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      throughput  = 125
      iops        = 3000
      encrypted   = true
    }
  }
  
  monitoring {
    enabled = var.enable_detailed_monitoring
  }
  
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-frontend-${var.environment}"
      Type        = "Frontend"
      Environment = var.environment
      Project     = var.project_name
    }
  }
  
  tags = {
    Name = "${var.project_name}-frontend-lt-${var.environment}"
  }
}

# Auto Scaling Group for Backend Servers
resource "aws_autoscaling_group" "backend" {
  name = "${var.project_name}-backend-asg-${var.environment}"
  
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.backend.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }
  
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
  
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 300
    }
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-backend-asg-${var.environment}"
    propagate_at_launch = false
  }
  
  tag {
    key                 = "Type"
    value               = "Backend"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }
}

# Auto Scaling Group for Frontend Servers
resource "aws_autoscaling_group" "frontend" {
  name = "${var.project_name}-frontend-asg-${var.environment}"
  
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.frontend.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.frontend.id
    version = "$Latest"
  }
  
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
  
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 300
    }
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-frontend-asg-${var.environment}"
    propagate_at_launch = false
  }
  
  tag {
    key                 = "Type"
    value               = "Frontend"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }
}

# Auto Scaling Policies - Backend
resource "aws_autoscaling_policy" "backend_scale_up" {
  name                   = "${var.project_name}-backend-scale-up-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.backend.name
}

resource "aws_autoscaling_policy" "backend_scale_down" {
  name                   = "${var.project_name}-backend-scale-down-${var.environment}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.backend.name
}

# Auto Scaling Policies - Frontend
resource "aws_autoscaling_policy" "frontend_scale_up" {
  name                   = "${var.project_name}-frontend-scale-up-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.frontend.name
}

resource "aws_autoscaling_policy" "frontend_scale_down" {
  name                   = "${var.project_name}-frontend-scale-down-${var.environment}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.frontend.name
}

# CloudWatch Alarms for Backend Scaling
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${var.project_name}-backend-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.cpu_target_utilization
  alarm_description   = "This metric monitors ec2 cpu utilization for backend servers"
  alarm_actions       = [aws_autoscaling_policy.backend_scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.backend.name
  }
  
  tags = {
    Name = "${var.project_name}-backend-cpu-high-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "backend_cpu_low" {
  alarm_name          = "${var.project_name}-backend-cpu-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization for backend servers"
  alarm_actions       = [aws_autoscaling_policy.backend_scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.backend.name
  }
  
  tags = {
    Name = "${var.project_name}-backend-cpu-low-${var.environment}"
  }
}

# CloudWatch Alarms for Frontend Scaling
resource "aws_cloudwatch_metric_alarm" "frontend_cpu_high" {
  alarm_name          = "${var.project_name}-frontend-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.cpu_target_utilization
  alarm_description   = "This metric monitors ec2 cpu utilization for frontend servers"
  alarm_actions       = [aws_autoscaling_policy.frontend_scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.frontend.name
  }
  
  tags = {
    Name = "${var.project_name}-frontend-cpu-high-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "frontend_cpu_low" {
  alarm_name          = "${var.project_name}-frontend-cpu-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization for frontend servers"
  alarm_actions       = [aws_autoscaling_policy.frontend_scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.frontend.name
  }
  
  tags = {
    Name = "${var.project_name}-frontend-cpu-low-${var.environment}"
  }
}

# Scheduled Scaling (Optional)
resource "aws_autoscaling_schedule" "backend_scale_out_business_hours" {
  count = var.scheduled_scaling ? 1 : 0
  
  scheduled_action_name  = "${var.project_name}-backend-scale-out-${var.environment}"
  min_size               = var.desired_capacity
  max_size               = var.max_capacity
  desired_capacity       = var.max_capacity
  recurrence             = "0 9 * * MON-FRI"  # 9 AM weekdays
  autoscaling_group_name = aws_autoscaling_group.backend.name
}

resource "aws_autoscaling_schedule" "backend_scale_in_after_hours" {
  count = var.scheduled_scaling ? 1 : 0
  
  scheduled_action_name  = "${var.project_name}-backend-scale-in-${var.environment}"
  min_size               = var.min_capacity
  max_size               = var.max_capacity
  desired_capacity       = var.min_capacity
  recurrence             = "0 18 * * MON-FRI"  # 6 PM weekdays
  autoscaling_group_name = aws_autoscaling_group.backend.name
}

resource "aws_autoscaling_schedule" "frontend_scale_out_business_hours" {
  count = var.scheduled_scaling ? 1 : 0
  
  scheduled_action_name  = "${var.project_name}-frontend-scale-out-${var.environment}"
  min_size               = var.desired_capacity
  max_size               = var.max_capacity
  desired_capacity       = var.max_capacity
  recurrence             = "0 9 * * MON-FRI"  # 9 AM weekdays
  autoscaling_group_name = aws_autoscaling_group.frontend.name
}

resource "aws_autoscaling_schedule" "frontend_scale_in_after_hours" {
  count = var.scheduled_scaling ? 1 : 0
  
  scheduled_action_name  = "${var.project_name}-frontend-scale-in-${var.environment}"
  min_size               = var.min_capacity
  max_size               = var.max_capacity
  desired_capacity       = var.min_capacity
  recurrence             = "0 18 * * MON-FRI"  # 6 PM weekdays
  autoscaling_group_name = aws_autoscaling_group.frontend.name
}