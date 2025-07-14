// File: BE/src/services/domainSetupService.js
// Service để tự động setup domain với SSL khi thêm vào site

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

class DomainSetupService {
  constructor() {
    this.scriptPath = '/home/dbuser/ssl-automation/setup-domain.sh';
    this.checkScriptPath = '/home/dbuser/ssl-automation/check-ssl.sh';
    this.removeScriptPath = '/home/dbuser/ssl-automation/remove-domain.sh';
  }

  /**
   * Setup domain với SSL và Nginx
   * Được gọi sau khi domain được thêm vào database
   */
  async setupDomain(domain, siteId) {
    try {
      console.log(`[DomainSetup] Setting up domain: ${domain} for site: ${siteId}`);
      
      // Run setup script
      const { stdout, stderr } = await execPromise(
        `sudo ${this.scriptPath} ${domain} ${siteId}`
      );
      
      if (stderr && !stderr.includes('reload')) {
        throw new Error(stderr);
      }
      
      console.log(`[DomainSetup] Success: ${stdout}`);
      return {
        success: true,
        message: `Domain ${domain} has been setup with SSL`,
        details: stdout
      };
      
    } catch (error) {
      console.error(`[DomainSetup] Error setting up domain ${domain}:`, error);
      return {
        success: false,
        error: error.message,
        domain
      };
    }
  }

  /**
   * Check SSL status của domain
   */
  async checkDomainSSL(domain) {
    try {
      const { stdout } = await execPromise(`${this.checkScriptPath} ${domain}`);
      
      return {
        success: true,
        status: stdout,
        hasSSL: stdout.includes('Certificate found: YES')
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove domain configuration
   * Được gọi khi xóa domain khỏi site
   */
  async removeDomain(domain) {
    try {
      console.log(`[DomainSetup] Removing domain configuration: ${domain}`);
      
      const { stdout, stderr } = await execPromise(
        `sudo ${this.removeScriptPath} ${domain}`
      );
      
      if (stderr) {
        throw new Error(stderr);
      }
      
      console.log(`[DomainSetup] Removed: ${stdout}`);
      return {
        success: true,
        message: `Domain ${domain} configuration removed`
      };
      
    } catch (error) {
      console.error(`[DomainSetup] Error removing domain ${domain}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup multiple domains (for new site creation)
   */
  async setupMultipleDomains(domains, siteId) {
    const results = [];
    
    for (const domain of domains) {
      const result = await this.setupDomain(domain, siteId);
      results.push({
        domain,
        ...result
      });
    }
    
    return results;
  }
}

export default new DomainSetupService();
