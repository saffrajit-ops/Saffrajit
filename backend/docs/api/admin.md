# Admin API

## Overview
Comprehensive administrative functions for platform management, user administration, analytics, and system configuration.

## Dashboard and Analytics

### Get Dashboard Statistics
Retrieve high-level platform statistics and KPIs.

**Endpoint:** `GET /api/admin/dashboard`
**Authentication:** Required (Admin role)

#### Dashboard Metrics
Returns comprehensive platform overview:
- Total users and growth trends
- Order statistics and revenue
- Product inventory status
- Recent activity feed
- System health indicators
- Performance metrics

#### Time-Based Analytics
- Today's statistics
- Week-over-week comparisons
- Monthly trends
- Year-to-date summaries

#### Alert Notifications
- Low stock warnings
- Pending order alerts
- User account issues
- System errors and warnings
- Security notifications

---

### Get Analytics Report
Generate detailed analytics reports for specific periods.

**Endpoint:** `GET /api/admin/analytics`
**Authentication:** Required (Admin role)

#### Query Parameters
- `period`: Time range (7d, 30d, 90d, 1y, custom)
- `startDate`: Custom period start date
- `endDate`: Custom period end date
- `metrics`: Specific metrics to include
- `format`: Response format (json, csv, pdf)

#### Report Categories
**Sales Analytics**: Revenue, orders, AOV trends
**Product Analytics**: Best sellers, inventory turnover
**Customer Analytics**: Acquisition, retention, lifetime value
**Marketing Analytics**: Campaign performance, ROI
**Operational Analytics**: Fulfillment times, returns

## User Management

### Get All Users
Retrieve paginated list of all platform users.

**Endpoint:** `GET /api/admin/users`
**Authentication:** Required (Admin role)

#### Query Parameters
- `page`: Page number
- `limit`: Users per page (max: 100)
- `search`: Search by name, email, phone
- `role`: Filter by user role
- `isActive`: Filter by active status
- `sort`: Sort order (-createdAt, name, email)

#### User Information
Returns user data including:
- Account details and credentials
- Profile information
- Role and permissions
- Activity statistics
- Order history summary
- Account status and flags

---

### Get User by ID
Retrieve detailed information for specific user.

**Endpoint:** `GET /api/admin/users/{userId}`
**Authentication:** Required (Admin role)

#### Detailed User Profile
Complete user information:
- Personal information and contacts
- Authentication methods
- Saved addresses and payment methods
- Order history with details
- Review and rating activity
- Support ticket history
- Login history and devices
- Account activity timeline

---

### Update User Role
Modify user's role and permissions.

**Endpoint:** `PUT /api/admin/users/{userId}/role`
**Authentication:** Required (Admin role)

#### Request Body
```json
{
  "role": "admin"
}
```

#### Available Roles
- **user**: Standard customer account
- **admin**: Full administrative access
- **moderator**: Limited admin capabilities
- **vendor**: Seller/supplier account

#### Role Change Workflow
- Validates role assignment permissions
- Updates user privileges
- Sends role change notification
- Logs administrative action
- Updates access control lists

---

### Toggle User Status
Activate or deactivate user accounts.

**Endpoint:** `PUT /api/admin/users/{userId}/toggle-status`
**Authentication:** Required (Admin role)

#### Status Management
- Active: Full account access
- Suspended: Temporary restriction
- Banned: Permanent access denial
- Pending: Awaiting verification

#### Status Change Effects
- Terminates active sessions
- Blocks new authentication
- Maintains order history
- Preserves user data
- Notifies user of status change

---

### Delete User Account
Remove user account from system.

**Endpoint:** `DELETE /api/admin/users/{userId}`
**Authentication:** Required (Super Admin role)

#### Deletion Policy
- Soft delete preserves order history
- Hard delete for GDPR compliance
- Anonymizes personal data
- Maintains transaction records
- Updates related references

## System Configuration

### Get System Settings
Retrieve platform configuration settings.

**Endpoint:** `GET /api/admin/settings`
**Authentication:** Required (Admin role)

#### Configuration Categories
**General Settings**: Site name, URL, contact info
**Email Settings**: SMTP configuration, templates
**Payment Settings**: Gateway configurations
**Shipping Settings**: Carriers, rates, zones
**Tax Settings**: Tax rates, jurisdictions
**Security Settings**: Authentication, rate limits

---

### Update System Settings
Modify platform configuration.

**Endpoint:** `PUT /api/admin/settings`
**Authentication:** Required (Admin role)

#### Updateable Settings
- Site information and branding
- Email and notification preferences
- Payment gateway credentials
- Shipping and fulfillment options
- Tax calculation rules
- Security and privacy policies

---

### Get Audit Logs
Retrieve system activity and change logs.

**Endpoint:** `GET /api/admin/audit-logs`
**Authentication:** Required (Admin role)

#### Audit Trail Information
- User actions and modifications
- System events and changes
- Authentication attempts
- Administrative operations
- Data access logs
- Error and exception logs

#### Log Filtering
- Filter by date range
- Filter by user or IP
- Filter by action type
- Filter by resource
- Search in log messages

## Content Management

### Manage Static Pages
Create and edit static content pages.

**Endpoint:** `POST|PUT /api/admin/pages`
**Authentication:** Required (Admin role)

#### Page Types
- About Us
- Terms of Service
- Privacy Policy
- FAQ pages
- Landing pages
- Custom content

---

### Manage Site Navigation
Configure menu structure and navigation.

**Endpoint:** `POST|PUT /api/admin/navigation`
**Authentication:** Required (Admin role)

#### Navigation Management
- Header menu configuration
- Footer menu structure
- Mobile menu optimization
- Mega menu setup
- Category navigation

## Bulk Operations

### Bulk User Operations
Perform batch actions on multiple users.

**Endpoint:** `POST /api/admin/users/bulk`
**Authentication:** Required (Admin role)

#### Supported Actions
- Bulk role assignment
- Mass email sending
- Account status updates
- Data export
- Password resets

---

### Bulk Product Operations
Batch manage products and inventory.

**Endpoint:** `POST /api/admin/products/bulk`
**Authentication:** Required (Admin role)

#### Bulk Actions
- Price updates
- Inventory adjustments
- Category reassignment
- Status changes
- Product imports

## Reporting and Export

### Generate Reports
Create detailed business reports.

**Endpoint:** `POST /api/admin/reports/generate`
**Authentication:** Required (Admin role)

#### Report Types
- Sales reports
- Inventory reports
- Customer reports
- Tax reports
- Financial statements

#### Export Formats
- CSV for data analysis
- PDF for presentation
- Excel for accounting
- JSON for integration

## Security and Monitoring

### Security Dashboard
Monitor security events and threats.

**Endpoint:** `GET /api/admin/security`
**Authentication:** Required (Admin role)

#### Security Metrics
- Failed login attempts
- Suspicious activity detection
- Rate limit violations
- API abuse monitoring
- Fraud indicators

---

### System Health Check
Monitor system performance and status.

**Endpoint:** `GET /api/admin/health`
**Authentication:** Required (Admin role)

#### Health Indicators
- Database connection status
- API response times
- External service availability
- Error rates
- Resource utilization

## Notification Management

### Send Platform Notifications
Broadcast messages to users or segments.

**Endpoint:** `POST /api/admin/notifications`
**Authentication:** Required (Admin role)

#### Notification Types
- System announcements
- Maintenance alerts
- Marketing messages
- Policy updates
- Emergency communications

#### Delivery Channels
- Email notifications
- SMS alerts
- Push notifications
- In-app messages
- Banner displays

## Integration Management

### Manage Third-Party Integrations
Configure external service connections.

**Endpoint:** `GET|POST|PUT /api/admin/integrations`
**Authentication:** Required (Admin role)

#### Integration Services
- Payment gateways
- Shipping carriers
- Email marketing
- Analytics platforms
- CRM systems
- Inventory management

## Administrative Best Practices

### Role-Based Access Control
- Principle of least privilege
- Regular permission audits
- Separation of duties
- Admin activity logging

### Data Protection
- Encryption at rest and transit
- Secure credential storage
- Regular backups
- Disaster recovery plans

### Compliance Management
- GDPR compliance tools
- Data retention policies
- Privacy request handling
- Regulatory reporting
