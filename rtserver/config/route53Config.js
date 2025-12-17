// routes/route53Routes.js
const express = require('express');
const router = express.Router();
const { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesCommand, ListResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");

// Initialize Route 53 client
const route53Client = new Route53Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configuration
const config = {
    hostedZoneId: "Z02887102VOIX6P1TU1VN",
    domain: "rhinon.help",
    ttl: 300,
    targetIP: "3.109.172.202",
};

// Middleware for API authentication (optional)
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// ============================================
// STEP 1: Check AWS Configuration
// ============================================
router.get('/check-config', authenticateAPI, async (req, res) => {
    try {
        // Test AWS credentials by listing hosted zones
        const command = new ListHostedZonesCommand({});
        const response = await route53Client.send(command);
        
        const rhinonZone = response.HostedZones.find(zone => 
            zone.Name === 'rhinon.help.'
        );
        
        res.json({
            success: true,
            message: 'AWS configuration is valid',
            data: {
                hostedZoneFound: !!rhinonZone,
                hostedZoneId: rhinonZone ? rhinonZone.Id.split('/').pop() : null,
                configuredZoneId: config.hostedZoneId,
                targetIP: config.targetIP,
                domain: config.domain
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'AWS configuration error',
            error: error.message
        });
    }
});

// ============================================
// STEP 2: Setup Wildcard DNS (One-time setup)
// ============================================
router.post('/setup-wildcard', authenticateAPI, async (req, res) => {
    try {
        const params = {
            HostedZoneId: config.hostedZoneId,
            ChangeBatch: {
                Comment: "Setting up wildcard DNS for dynamic subdomains",
                Changes: [
                    {
                        Action: "UPSERT",
                        ResourceRecordSet: {
                            Name: `*.${config.domain}`,
                            Type: "A",
                            TTL: config.ttl,
                            ResourceRecords: [
                                {
                                    Value: config.targetIP
                                }
                            ]
                        }
                    }
                ]
            }
        };

        const command = new ChangeResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        res.json({
            success: true,
            message: 'Wildcard DNS setup completed',
            data: {
                changeId: response.ChangeInfo.Id,
                status: response.ChangeInfo.Status,
                submittedAt: response.ChangeInfo.SubmittedAt,
                wildcardDomain: `*.${config.domain}`,
                pointsTo: config.targetIP
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to setup wildcard DNS',
            error: error.message
        });
    }
});

// ============================================
// STEP 3: Create Individual Subdomain
// ============================================
router.post('/create-subdomain', authenticateAPI, async (req, res) => {
    const { subdomain, targetIP } = req.body;
    
    // Validate input
    if (!subdomain) {
        return res.status(400).json({
            success: false,
            message: 'Subdomain is required'
        });
    }
    
    // Validate subdomain format
    if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens (3-30 characters)'
        });
    }
    
    try {
        const params = {
            HostedZoneId: config.hostedZoneId,
            ChangeBatch: {
                Comment: `Creating subdomain ${subdomain}.${config.domain}`,
                Changes: [
                    {
                        Action: "CREATE",
                        ResourceRecordSet: {
                            Name: `${subdomain}.${config.domain}`,
                            Type: "A",
                            TTL: config.ttl,
                            ResourceRecords: [
                                {
                                    Value: targetIP || config.targetIP
                                }
                            ]
                        }
                    }
                ]
            }
        };

        const command = new ChangeResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        res.json({
            success: true,
            message: 'Subdomain created successfully',
            data: {
                subdomain: `${subdomain}.${config.domain}`,
                url: `https://${subdomain}.${config.domain}`,
                changeId: response.ChangeInfo.Id,
                status: response.ChangeInfo.Status,
                targetIP: targetIP || config.targetIP
            }
        });
    } catch (error) {
        // Check if subdomain already exists
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: 'Subdomain already exists',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create subdomain',
            error: error.message
        });
    }
});

// ============================================
// STEP 4: Update Subdomain
// ============================================
router.put('/update-subdomain', authenticateAPI, async (req, res) => {
    const { subdomain, newTargetIP } = req.body;
    
    if (!subdomain || !newTargetIP) {
        return res.status(400).json({
            success: false,
            message: 'Subdomain and newTargetIP are required'
        });
    }
    
    try {
        const params = {
            HostedZoneId: config.hostedZoneId,
            ChangeBatch: {
                Comment: `Updating subdomain ${subdomain}.${config.domain}`,
                Changes: [
                    {
                        Action: "UPSERT",
                        ResourceRecordSet: {
                            Name: `${subdomain}.${config.domain}`,
                            Type: "A",
                            TTL: config.ttl,
                            ResourceRecords: [
                                {
                                    Value: newTargetIP
                                }
                            ]
                        }
                    }
                ]
            }
        };

        const command = new ChangeResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        res.json({
            success: true,
            message: 'Subdomain updated successfully',
            data: {
                subdomain: `${subdomain}.${config.domain}`,
                newTargetIP: newTargetIP,
                changeId: response.ChangeInfo.Id,
                status: response.ChangeInfo.Status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update subdomain',
            error: error.message
        });
    }
});

// ============================================
// STEP 5: Delete Subdomain
// ============================================
router.delete('/delete-subdomain/:subdomain', authenticateAPI, async (req, res) => {
    const { subdomain } = req.params;
    const { targetIP } = req.query; // Need current IP to delete
    
    if (!subdomain) {
        return res.status(400).json({
            success: false,
            message: 'Subdomain is required'
        });
    }
    
    try {
        const params = {
            HostedZoneId: config.hostedZoneId,
            ChangeBatch: {
                Comment: `Deleting subdomain ${subdomain}.${config.domain}`,
                Changes: [
                    {
                        Action: "DELETE",
                        ResourceRecordSet: {
                            Name: `${subdomain}.${config.domain}`,
                            Type: "A",
                            TTL: config.ttl,
                            ResourceRecords: [
                                {
                                    Value: targetIP || config.targetIP
                                }
                            ]
                        }
                    }
                ]
            }
        };

        const command = new ChangeResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        res.json({
            success: true,
            message: 'Subdomain deleted successfully',
            data: {
                subdomain: `${subdomain}.${config.domain}`,
                changeId: response.ChangeInfo.Id,
                status: response.ChangeInfo.Status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete subdomain',
            error: error.message
        });
    }
});

// ============================================
// STEP 6: List All Subdomains
// ============================================
router.get('/list-subdomains', authenticateAPI, async (req, res) => {
    try {
        const params = {
            HostedZoneId: config.hostedZoneId,
            MaxItems: 100
        };
        
        const command = new ListResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        // Filter for A records that are subdomains
        const subdomains = response.ResourceRecordSets
            .filter(record => 
                record.Type === 'A' && 
                record.Name.endsWith(`.${config.domain}.`) &&
                record.Name !== `${config.domain}.` &&
                record.Name !== `www.${config.domain}.`
            )
            .map(record => ({
                subdomain: record.Name.replace(`.${config.domain}.`, ''),
                fullDomain: record.Name.slice(0, -1), // Remove trailing dot
                targetIP: record.ResourceRecords?.[0]?.Value,
                ttl: record.TTL,
                type: record.Type
            }));
        
        res.json({
            success: true,
            message: 'Subdomains retrieved successfully',
            data: {
                count: subdomains.length,
                subdomains: subdomains
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to list subdomains',
            error: error.message
        });
    }
});

// ============================================
// STEP 7: Check Subdomain Availability
// ============================================
router.get('/check-availability/:subdomain', async (req, res) => {
    const { subdomain } = req.params;
    
    if (!subdomain) {
        return res.status(400).json({
            success: false,
            message: 'Subdomain is required'
        });
    }
    
    // Validate subdomain format
    if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subdomain format',
            available: false
        });
    }
    
    try {
        const params = {
            HostedZoneId: config.hostedZoneId,
            StartRecordName: `${subdomain}.${config.domain}`,
            StartRecordType: 'A',
            MaxItems: 1
        };
        
        const command = new ListResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        const exists = response.ResourceRecordSets.some(record => 
            record.Name === `${subdomain}.${config.domain}.`
        );
        
        res.json({
            success: true,
            data: {
                subdomain: subdomain,
                fullDomain: `${subdomain}.${config.domain}`,
                available: !exists,
                message: exists ? 'Subdomain is already taken' : 'Subdomain is available'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to check availability',
            error: error.message
        });
    }
});

// ============================================
// STEP 8: Batch Create Subdomains
// ============================================
router.post('/batch-create', authenticateAPI, async (req, res) => {
    const { subdomains } = req.body; // Array of {subdomain, targetIP}
    
    if (!Array.isArray(subdomains) || subdomains.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Subdomains array is required'
        });
    }
    
    if (subdomains.length > 10) {
        return res.status(400).json({
            success: false,
            message: 'Maximum 10 subdomains per batch'
        });
    }
    
    try {
        const changes = subdomains.map(item => ({
            Action: "CREATE",
            ResourceRecordSet: {
                Name: `${item.subdomain}.${config.domain}`,
                Type: "A",
                TTL: config.ttl,
                ResourceRecords: [
                    {
                        Value: item.targetIP || config.targetIP
                    }
                ]
            }
        }));
        
        const params = {
            HostedZoneId: config.hostedZoneId,
            ChangeBatch: {
                Comment: `Batch creating ${subdomains.length} subdomains`,
                Changes: changes
            }
        };

        const command = new ChangeResourceRecordSetsCommand(params);
        const response = await route53Client.send(command);
        
        res.json({
            success: true,
            message: `${subdomains.length} subdomains created successfully`,
            data: {
                count: subdomains.length,
                changeId: response.ChangeInfo.Id,
                status: response.ChangeInfo.Status,
                subdomains: subdomains.map(item => ({
                    subdomain: `${item.subdomain}.${config.domain}`,
                    url: `https://${item.subdomain}.${config.domain}`
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create subdomains in batch',
            error: error.message
        });
    }
});

module.exports = router;