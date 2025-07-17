# Load Balancer Configuration
# DM_CRM Sales Dashboard - Production Infrastructure

# Target Groups
resource "aws_lb_target_group" "backend" {
  name     = "${var.project_name}-backend-tg-${var.environment}"
  port     = var.app_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = var.healthy_threshold
    unhealthy_threshold = var.unhealthy_threshold
    timeout             = var.health_check_timeout
    interval            = var.health_check_interval
    path                = var.health_check_path
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 24 hours
    enabled         = true
  }
  
  tags = {
    Name = "${var.project_name}-backend-tg-${var.environment}"
  }
}

resource "aws_lb_target_group" "frontend" {
  name     = "${var.project_name}-frontend-tg-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = var.healthy_threshold
    unhealthy_threshold = var.unhealthy_threshold
    timeout             = var.health_check_timeout
    interval            = var.health_check_interval
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 24 hours
    enabled         = true
  }
  
  tags = {
    Name = "${var.project_name}-frontend-tg-${var.environment}"
  }
}

# ALB Listeners
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
  
  tags = {
    Name = "${var.project_name}-http-listener-${var.environment}"
  }
}

resource "aws_lb_listener" "https" {
  count = local.certificate_arn != "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = local.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
  
  tags = {
    Name = "${var.project_name}-https-listener-${var.environment}"
  }
}

# HTTP Listener (fallback when no SSL certificate)
resource "aws_lb_listener" "http_fallback" {
  count = local.certificate_arn == "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
  
  tags = {
    Name = "${var.project_name}-http-fallback-listener-${var.environment}"
  }
}

# Listener Rules for API routing
resource "aws_lb_listener_rule" "api" {
  count = local.certificate_arn != "" ? 1 : 0
  
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
  
  tags = {
    Name = "${var.project_name}-api-rule-${var.environment}"
  }
}

# Fallback API rule for HTTP
resource "aws_lb_listener_rule" "api_fallback" {
  count = local.certificate_arn == "" ? 1 : 0
  
  listener_arn = aws_lb_listener.http_fallback[0].arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
  
  tags = {
    Name = "${var.project_name}-api-fallback-rule-${var.environment}"
  }
}

# Health check rule
resource "aws_lb_listener_rule" "health" {
  count = local.certificate_arn != "" ? 1 : 0
  
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 200
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = ["/health", "/api/health"]
    }
  }
  
  tags = {
    Name = "${var.project_name}-health-rule-${var.environment}"
  }
}

# Fallback health check rule for HTTP
resource "aws_lb_listener_rule" "health_fallback" {
  count = local.certificate_arn == "" ? 1 : 0
  
  listener_arn = aws_lb_listener.http_fallback[0].arn
  priority     = 200
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = ["/health", "/api/health"]
    }
  }
  
  tags = {
    Name = "${var.project_name}-health-fallback-rule-${var.environment}"
  }
}

# Maintenance page (optional)
resource "aws_lb_listener_rule" "maintenance" {
  count = local.certificate_arn != "" ? 1 : 0
  
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 50
  
  action {
    type = "fixed-response"
    
    fixed_response {
      content_type = "text/html"
      message_body = templatefile("${path.module}/templates/maintenance.html", {
        project_name = var.project_name
        environment  = var.environment
      })
      status_code = "503"
    }
  }
  
  condition {
    path_pattern {
      values = ["/maintenance"]
    }
  }
  
  tags = {
    Name = "${var.project_name}-maintenance-rule-${var.environment}"
  }
}

# CloudWatch Alarms for Load Balancer
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-alb-response-time-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors ALB response time"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = {
    Name = "${var.project_name}-alb-response-time-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_error_rate" {
  alarm_name          = "${var.project_name}-alb-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx errors"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = {
    Name = "${var.project_name}-alb-error-rate-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "backend_target_health" {
  alarm_name          = "${var.project_name}-backend-target-health-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors backend target health"
  treat_missing_data  = "breaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = {
    Name = "${var.project_name}-backend-target-health-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "frontend_target_health" {
  alarm_name          = "${var.project_name}-frontend-target-health-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors frontend target health"
  treat_missing_data  = "breaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.frontend.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = {
    Name = "${var.project_name}-frontend-target-health-${var.environment}"
  }
}