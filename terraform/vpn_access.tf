# VPN Access Configuration
# DM_CRM Sales Dashboard - Production Infrastructure

# Client VPN Endpoint for secure remote access
resource "aws_ec2_client_vpn_endpoint" "main" {
  count = var.enable_vpn ? 1 : 0
  
  description            = "${var.project_name} Client VPN - ${var.environment}"
  server_certificate_arn = aws_acm_certificate.vpn_server[0].arn
  client_cidr_block      = var.vpn_client_cidr
  
  authentication_options {
    type                       = "certificate-authentication"
    root_certificate_chain_arn = aws_acm_certificate.vpn_client_root[0].arn
  }
  
  connection_log_options {
    enabled               = true
    cloudwatch_log_group  = aws_cloudwatch_log_group.vpn_logs[0].name
    cloudwatch_log_stream = aws_cloudwatch_log_stream.vpn_connection_logs[0].name
  }
  
  dns_servers = [
    cidrhost(aws_vpc.main.cidr_block, 2)  # VPC DNS resolver
  ]
  
  # Security group for VPN endpoint
  security_group_ids = [aws_security_group.vpn_endpoint[0].id]
  vpc_id            = aws_vpc.main.id
  vpn_port          = 443
  
  # Split tunnel configuration - only route VPC traffic through VPN
  split_tunnel = true
  
  tags = {
    Name = "${var.project_name}-vpn-endpoint-${var.environment}"
  }
}

# VPN Endpoint Security Group
resource "aws_security_group" "vpn_endpoint" {
  count = var.enable_vpn ? 1 : 0
  
  name_prefix = "${var.project_name}-vpn-endpoint-${var.environment}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Client VPN endpoint"
  
  ingress {
    description = "VPN access"
    from_port   = 443
    to_port     = 443
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-vpn-endpoint-sg-${var.environment}"
  }
}

# Associate VPN with private subnets for access to internal resources
resource "aws_ec2_client_vpn_network_association" "private_subnet_1" {
  count = var.enable_vpn ? 1 : 0
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
  subnet_id              = aws_subnet.private[0].id
}

resource "aws_ec2_client_vpn_network_association" "private_subnet_2" {
  count = var.enable_vpn ? 1 : 0
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
  subnet_id              = aws_subnet.private[1].id
}

# VPN Authorization Rules
resource "aws_ec2_client_vpn_authorization_rule" "vpc_access" {
  count = var.enable_vpn ? 1 : 0
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
  target_network_cidr    = aws_vpc.main.cidr_block
  authorize_all_groups   = true
  description            = "Allow access to VPC resources"
}

resource "aws_ec2_client_vpn_authorization_rule" "internet_access" {
  count = var.enable_vpn ? 1 : 0
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
  target_network_cidr    = "0.0.0.0/0"
  authorize_all_groups   = true
  description            = "Allow internet access through VPN"
}

# Route table for VPN traffic
resource "aws_ec2_client_vpn_route" "vpc_route" {
  count = var.enable_vpn ? 1 : 0
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
  destination_cidr_block = aws_vpc.main.cidr_block
  target_vpc_subnet_id   = aws_subnet.private[0].id
  description            = "Route to VPC resources"
  
  depends_on = [aws_ec2_client_vpn_network_association.private_subnet_1]
}

resource "aws_ec2_client_vpn_route" "internet_route" {
  count = var.enable_vpn ? 1 : 0
  
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
  destination_cidr_block = "0.0.0.0/0"
  target_vpc_subnet_id   = aws_subnet.private[0].id
  description            = "Route to internet via NAT Gateway"
  
  depends_on = [aws_ec2_client_vpn_network_association.private_subnet_1]
}

# Server Certificate for VPN
resource "aws_acm_certificate" "vpn_server" {
  count = var.enable_vpn ? 1 : 0
  
  private_key      = tls_private_key.vpn_server[0].private_key_pem
  certificate_body = tls_self_signed_cert.vpn_server[0].cert_pem
  
  tags = {
    Name = "${var.project_name}-vpn-server-cert-${var.environment}"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "tls_private_key" "vpn_server" {
  count = var.enable_vpn ? 1 : 0
  
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "vpn_server" {
  count = var.enable_vpn ? 1 : 0
  
  private_key_pem = tls_private_key.vpn_server[0].private_key_pem
  
  subject {
    common_name         = "vpn-server.${var.domain_name}"
    organization        = var.project_name
    organizational_unit = "DevOps"
    country             = "US"
    province            = "CA"
    locality            = "San Francisco"
  }
  
  validity_period_hours = 8760  # 1 year
  early_renewal_hours   = 720   # 30 days
  
  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

# Client Root Certificate Authority
resource "aws_acm_certificate" "vpn_client_root" {
  count = var.enable_vpn ? 1 : 0
  
  private_key      = tls_private_key.vpn_client_root[0].private_key_pem
  certificate_body = tls_self_signed_cert.vpn_client_root[0].cert_pem
  
  tags = {
    Name = "${var.project_name}-vpn-client-ca-${var.environment}"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "tls_private_key" "vpn_client_root" {
  count = var.enable_vpn ? 1 : 0
  
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "vpn_client_root" {
  count = var.enable_vpn ? 1 : 0
  
  private_key_pem = tls_private_key.vpn_client_root[0].private_key_pem
  
  subject {
    common_name         = "vpn-client-ca.${var.domain_name}"
    organization        = var.project_name
    organizational_unit = "DevOps"
    country             = "US"
    province            = "CA"
    locality            = "San Francisco"
  }
  
  validity_period_hours = 17520  # 2 years
  early_renewal_hours   = 720    # 30 days
  
  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "cert_signing",
    "crl_signing",
  ]
  
  is_ca_certificate = true
}

# Client Certificate Template (for individual users)
resource "tls_private_key" "vpn_client_template" {
  count = var.enable_vpn ? 1 : 0
  
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "vpn_client_template" {
  count = var.enable_vpn ? 1 : 0
  
  private_key_pem = tls_private_key.vpn_client_template[0].private_key_pem
  
  subject {
    common_name         = "vpn-client-template"
    organization        = var.project_name
    organizational_unit = "Users"
    country             = "US"
    province            = "CA"
    locality            = "San Francisco"
  }
}

resource "tls_locally_signed_cert" "vpn_client_template" {
  count = var.enable_vpn ? 1 : 0
  
  cert_request_pem   = tls_cert_request.vpn_client_template[0].cert_request_pem
  ca_private_key_pem = tls_private_key.vpn_client_root[0].private_key_pem
  ca_cert_pem        = tls_self_signed_cert.vpn_client_root[0].cert_pem
  
  validity_period_hours = 8760  # 1 year
  early_renewal_hours   = 720   # 30 days
  
  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "client_auth",
  ]
}

# CloudWatch Logs for VPN connections
resource "aws_cloudwatch_log_group" "vpn_logs" {
  count = var.enable_vpn ? 1 : 0
  
  name              = "/aws/clientvpn/${var.project_name}-${var.environment}"
  retention_in_days = 30
  
  tags = {
    Name = "${var.project_name}-vpn-logs-${var.environment}"
  }
}

resource "aws_cloudwatch_log_stream" "vpn_connection_logs" {
  count = var.enable_vpn ? 1 : 0
  
  name           = "vpn-connection-logs"
  log_group_name = aws_cloudwatch_log_group.vpn_logs[0].name
}

# CloudWatch Alarms for VPN monitoring
resource "aws_cloudwatch_metric_alarm" "vpn_connection_failures" {
  count = var.enable_vpn ? 1 : 0
  
  alarm_name          = "${var.project_name}-vpn-connection-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConnectionAttemptFailureCount"
  namespace           = "AWS/ClientVPN"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors VPN connection failures"
  
  dimensions = {
    ClientVpnEndpointId = aws_ec2_client_vpn_endpoint.main[0].id
  }
  
  alarm_actions = [aws_sns_topic.security_alerts.arn]
  
  tags = {
    Name = "${var.project_name}-vpn-connection-failures-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "vpn_active_connections" {
  count = var.enable_vpn ? 1 : 0
  
  alarm_name          = "${var.project_name}-vpn-active-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ActiveConnectionsCount"
  namespace           = "AWS/ClientVPN"
  period              = "300"
  statistic           = "Maximum"
  threshold           = var.vpn_max_connections
  alarm_description   = "This metric monitors active VPN connections"
  
  dimensions = {
    ClientVpnEndpointId = aws_ec2_client_vpn_endpoint.main[0].id
  }
  
  alarm_actions = [aws_sns_topic.security_alerts.arn]
  
  tags = {
    Name = "${var.project_name}-vpn-active-connections-${var.environment}"
  }
}

# IAM role for VPN logging
resource "aws_iam_role" "vpn_logs_role" {
  count = var.enable_vpn ? 1 : 0
  
  name = "${var.project_name}-vpn-logs-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpn.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-vpn-logs-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "vpn_logs_policy" {
  count = var.enable_vpn ? 1 : 0
  
  name = "${var.project_name}-vpn-logs-policy-${var.environment}"
  role = aws_iam_role.vpn_logs_role[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# VPN Configuration file template for clients
resource "local_file" "vpn_client_config_template" {
  count = var.enable_vpn ? 1 : 0
  
  filename = "${path.module}/vpn-client-config-template.ovpn"
  
  content = templatefile("${path.module}/templates/client-config.ovpn.tpl", {
    client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.main[0].id
    region                 = var.aws_region
    ca_cert                = tls_self_signed_cert.vpn_client_root[0].cert_pem
    client_cert            = tls_locally_signed_cert.vpn_client_template[0].cert_pem
    client_key             = tls_private_key.vpn_client_template[0].private_key_pem
  })
  
  depends_on = [aws_ec2_client_vpn_endpoint.main]
}

# Create the template directory and file
resource "local_file" "client_config_template" {
  count = var.enable_vpn ? 1 : 0
  
  filename = "${path.module}/templates/client-config.ovpn.tpl"
  
  content = <<-EOT
client
dev tun
proto udp
remote cvpn-endpoint-$${client_vpn_endpoint_id}.prod.clientvpn.$${region}.amazonaws.com 443
remote-random-hostname
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
verb 3

<ca>
$${ca_cert}
</ca>

<cert>
$${client_cert}
</cert>

<key>
$${client_key}
</key>

reneg-sec 0
EOT
}

# Outputs for VPN configuration
output "vpn_endpoint_id" {
  description = "ID of the Client VPN endpoint"
  value       = var.enable_vpn ? aws_ec2_client_vpn_endpoint.main[0].id : null
}

output "vpn_endpoint_dns_name" {
  description = "DNS name of the Client VPN endpoint"
  value       = var.enable_vpn ? aws_ec2_client_vpn_endpoint.main[0].dns_name : null
}

output "vpn_client_cidr" {
  description = "CIDR block for VPN clients"
  value       = var.enable_vpn ? aws_ec2_client_vpn_endpoint.main[0].client_cidr_block : null
}

output "vpn_configuration_file" {
  description = "Path to VPN client configuration template"
  value       = var.enable_vpn ? local_file.vpn_client_config_template[0].filename : null
}

# Security Group modifications to allow VPN access to internal resources
resource "aws_security_group_rule" "app_vpn_access" {
  count = var.enable_vpn ? 1 : 0
  
  type              = "ingress"
  from_port         = var.app_port
  to_port           = var.app_port
  protocol          = "tcp"
  cidr_blocks       = [var.vpn_client_cidr]
  security_group_id = aws_security_group.app_servers.id
  description       = "Allow VPN access to application servers"
}

resource "aws_security_group_rule" "db_vpn_access" {
  count = var.enable_vpn ? 1 : 0
  
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [var.vpn_client_cidr]
  security_group_id = aws_security_group.database.id
  description       = "Allow VPN access to database (for admin access)"
}

resource "aws_security_group_rule" "bastion_vpn_access" {
  count = var.enable_vpn ? 1 : 0
  
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = [var.vpn_client_cidr]
  security_group_id = aws_security_group.bastion.id
  description       = "Allow VPN access to bastion host"
}