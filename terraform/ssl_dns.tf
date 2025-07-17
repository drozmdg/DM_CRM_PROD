# SSL Certificate and DNS Configuration
# DM_CRM Sales Dashboard - Production Infrastructure

# Data source for existing hosted zone (if available)
data "aws_route53_zone" "main" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  name  = var.domain_name
}

# Route53 Hosted Zone (create if not exists)
resource "aws_route53_zone" "main" {
  count = var.domain_name != "salesdashboard.example.com" && length(data.aws_route53_zone.main) == 0 ? 1 : 0
  name  = var.domain_name
  
  tags = {
    Name = "${var.project_name}-zone-${var.environment}"
  }
}

# SSL Certificate from ACM
resource "aws_acm_certificate" "main" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "${var.project_name}-cert-${var.environment}"
  }
}

# DNS validation records for ACM certificate
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "salesdashboard.example.com" ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}
  
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = try(data.aws_route53_zone.main[0].zone_id, aws_route53_zone.main[0].zone_id)
}

# Certificate validation
resource "aws_acm_certificate_validation" "main" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
  
  timeouts {
    create = "5m"
  }
}

# DNS records for application
resource "aws_route53_record" "main" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  zone_id = try(data.aws_route53_zone.main[0].zone_id, aws_route53_zone.main[0].zone_id)
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# WWW subdomain redirect
resource "aws_route53_record" "www" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  zone_id = try(data.aws_route53_zone.main[0].zone_id, aws_route53_zone.main[0].zone_id)
  name    = "www.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# API subdomain (optional)
resource "aws_route53_record" "api" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  zone_id = try(data.aws_route53_zone.main[0].zone_id, aws_route53_zone.main[0].zone_id)
  name    = "api.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Health check for domain
resource "aws_route53_health_check" "main" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  fqdn                            = var.domain_name
  port                            = 443
  type                            = "HTTPS"
  resource_path                   = "/health"
  failure_threshold               = "3"
  request_interval                = "30"
  cloudwatch_alarm_region         = var.aws_region
  cloudwatch_alarm_name           = "${var.project_name}-domain-health-${var.environment}"
  insufficient_data_health_status = "Failure"
  
  tags = {
    Name = "${var.project_name}-health-check-${var.environment}"
  }
}

# CloudWatch alarm for health check
resource "aws_cloudwatch_metric_alarm" "domain_health" {
  count = var.domain_name != "salesdashboard.example.com" ? 1 : 0
  
  alarm_name          = "${var.project_name}-domain-health-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors domain health"
  treat_missing_data  = "breaching"
  
  dimensions = {
    HealthCheckId = aws_route53_health_check.main[0].id
  }
  
  tags = {
    Name = "${var.project_name}-domain-health-alarm-${var.environment}"
  }
}

# Self-signed certificate for development/testing (when no domain configured)
resource "tls_private_key" "self_signed" {
  count     = var.domain_name == "salesdashboard.example.com" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "self_signed" {
  count           = var.domain_name == "salesdashboard.example.com" ? 1 : 0
  private_key_pem = tls_private_key.self_signed[0].private_key_pem
  
  subject {
    common_name  = "salesdashboard.example.com"
    organization = "DM CRM Development"
  }
  
  validity_period_hours = 8760  # 1 year
  
  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate" "self_signed" {
  count            = var.domain_name == "salesdashboard.example.com" ? 1 : 0
  private_key      = tls_private_key.self_signed[0].private_key_pem
  certificate_body = tls_self_signed_cert.self_signed[0].cert_pem
  
  tags = {
    Name = "${var.project_name}-self-signed-cert-${var.environment}"
  }
}

# Update load balancer listener to use the appropriate certificate
locals {
  certificate_arn = var.domain_name != "salesdashboard.example.com" ? (
    length(aws_acm_certificate_validation.main) > 0 ? 
    aws_acm_certificate_validation.main[0].certificate_arn : 
    ""
  ) : (
    length(aws_acm_certificate.self_signed) > 0 ? 
    aws_acm_certificate.self_signed[0].arn : 
    ""
  )
}

# CloudFront distribution for global content delivery (optional)
resource "aws_cloudfront_distribution" "main" {
  count = var.enable_cloudfront ? 1 : 0
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "${var.project_name}-alb-origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  enabled = true
  
  aliases = var.domain_name != "salesdashboard.example.com" ? [var.domain_name, "www.${var.domain_name}"] : []
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-alb-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "CloudFront-Forwarded-Proto"]
      
      cookies {
        forward = "all"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-alb-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
  }
  
  # Cache behavior for API (no caching)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-alb-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }
    
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }
  
  price_class = "PriceClass_100"  # US, Canada, Europe
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = var.domain_name != "salesdashboard.example.com" ? aws_acm_certificate_validation.main[0].certificate_arn : null
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  web_acl_id = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
  
  tags = {
    Name = "${var.project_name}-cloudfront-${var.environment}"
  }
}

# WAF for application protection
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0
  
  name  = "${var.project_name}-waf-${var.environment}"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }
  
  tags = {
    Name = "${var.project_name}-waf-${var.environment}"
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}WAFMetric"
    sampled_requests_enabled   = true
  }
}