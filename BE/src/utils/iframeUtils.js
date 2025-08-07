import Iframe from '../model/Iframe.js';

/**
 * Check if a URL is an iframe domain and add users to viewers if it is
 * @param {string} url - The URL to check
 * @param {Array} userIds - Array of user IDs to add as viewers
 * @returns {Promise<{isIframe: boolean, iframe: Object|null, message: string}>}
 */
export const addUsersToIframeIfExists = async (url, userIds) => {
  try {
    console.log(`[IFRAME UTILS] addUsersToIframeIfExists called with:`, { url, userIds });
    
    if (!url || !Array.isArray(userIds) || userIds.length === 0) {
      console.log(`[IFRAME UTILS] Invalid parameters:`, { url, userIds });
      return {
        isIframe: false,
        iframe: null,
        message: 'Invalid parameters'
      };
    }

    // Extract domain from URL
    // Patterns to match:
    // - https://domain.example.com/iframe/view/domain_name
    // - https://example.com/iframe/view/domain_name
    // - https://domain.com/path (where path is the iframe domain)
    // - Direct iframe domain: domain_name
    
    let domain = null;
    
    // Try to extract domain from iframe view URL pattern
    const iframeViewMatch = url.match(/\/iframe\/view\/([a-zA-Z0-9-]+)/);
    if (iframeViewMatch) {
      domain = iframeViewMatch[1];
      console.log(`[IFRAME UTILS] Extracted domain from iframe view pattern:`, domain);
    } else {
      // Try to match direct domain (if URL is just the domain name)
      const directDomainMatch = url.match(/^[a-zA-Z0-9-]+$/);
      if (directDomainMatch) {
        domain = url;
        console.log(`[IFRAME UTILS] Extracted domain from direct pattern:`, domain);
      } else {
        // Try to extract from full URL path (e.g., https://dev.2tdata.com/2tdata -> 2tdata)
        const fullUrlMatch = url.match(/https?:\/\/[^\/]+\/([a-zA-Z0-9-]+)(?:\/|$)/);
        if (fullUrlMatch) {
          domain = fullUrlMatch[1];
          console.log(`[IFRAME UTILS] Extracted domain from full URL path:`, domain);
        }
      }
    }

    if (!domain) {
      console.log(`[IFRAME UTILS] URL does not match iframe pattern:`, url);
      return {
        isIframe: false,
        iframe: null,
        message: 'URL does not match iframe pattern'
      };
    }

    console.log(`[IFRAME UTILS] Looking for iframe with domain:`, domain);
    
    // Find iframe by domain
    const iframe = await Iframe.findOne({ domain: domain });
    
    if (!iframe) {
      console.log(`[IFRAME UTILS] No iframe found with domain:`, domain);
      return {
        isIframe: false,
        iframe: null,
        message: `No iframe found with domain: ${domain}`
      };
    }
    
    console.log(`[IFRAME UTILS] Found iframe:`, { 
      id: iframe._id, 
      title: iframe.title, 
      domain: iframe.domain,
      currentViewersCount: iframe.viewers.length 
    });

    // Check if users are already in viewers list
    const currentViewers = iframe.viewers.map(v => v.toString());
    const newViewers = userIds.filter(userId => !currentViewers.includes(userId.toString()));
    
    console.log(`[IFRAME UTILS] Current viewers:`, currentViewers);
    console.log(`[IFRAME UTILS] New viewers to add:`, newViewers);
    
    if (newViewers.length === 0) {
      console.log(`[IFRAME UTILS] All users are already viewers`);
      return {
        isIframe: true,
        iframe: iframe,
        message: 'All users are already viewers of this iframe'
      };
    }

    // Add new viewers to iframe
    console.log(`[IFRAME UTILS] Adding ${newViewers.length} new viewers to iframe`);
    iframe.viewers.push(...newViewers);
    await iframe.save();
    console.log(`[IFRAME UTILS] Successfully saved iframe with ${iframe.viewers.length} total viewers`);

    // Return updated iframe (không populate để tránh lỗi User model)
    const updatedIframe = await Iframe.findById(iframe._id);

    return {
      isIframe: true,
      iframe: updatedIframe,
      message: `Successfully added ${newViewers.length} user(s) to iframe viewers`
    };

  } catch (error) {
    console.error('Error in addUsersToIframeIfExists:', error);
    return {
      isIframe: false,
      iframe: null,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Remove users from iframe viewers when they lose access to shared link
 * @param {string} url - The URL to check
 * @param {Array} userIds - Array of user IDs to remove from viewers
 * @returns {Promise<{isIframe: boolean, iframe: Object|null, message: string}>}
 */
export const removeUsersFromIframeIfExists = async (url, userIds) => {
  try {
    if (!url || !Array.isArray(userIds) || userIds.length === 0) {
      return {
        isIframe: false,
        iframe: null,
        message: 'Invalid parameters'
      };
    }

    // Extract domain from URL using same logic as above
    let domain = null;
    
    const iframeViewMatch = url.match(/\/iframe\/view\/([a-zA-Z0-9-]+)/);
    if (iframeViewMatch) {
      domain = iframeViewMatch[1];
    } else {
      const directDomainMatch = url.match(/^[a-zA-Z0-9-]+$/);
      if (directDomainMatch) {
        domain = url;
      }
    }

    if (!domain) {
      return {
        isIframe: false,
        iframe: null,
        message: 'URL does not match iframe pattern'
      };
    }

    // Find iframe by domain
    const iframe = await Iframe.findOne({ domain: domain });
    
    if (!iframe) {
      return {
        isIframe: false,
        iframe: null,
        message: `No iframe found with domain: ${domain}`
      };
    }

    // Remove users from viewers list
    const userIdsAsStrings = userIds.map(id => id.toString());
    const originalViewersCount = iframe.viewers.length;
    iframe.viewers = iframe.viewers.filter(viewerId => 
      !userIdsAsStrings.includes(viewerId.toString())
    );
    
    const removedCount = originalViewersCount - iframe.viewers.length;
    
    if (removedCount === 0) {
      return {
        isIframe: true,
        iframe: iframe,
        message: 'No users were removed (they were not viewers)'
      };
    }

    await iframe.save();

    // Return updated iframe (không populate để tránh lỗi User model)
    const updatedIframe = await Iframe.findById(iframe._id);

    return {
      isIframe: true,
      iframe: updatedIframe,
      message: `Successfully removed ${removedCount} user(s) from iframe viewers`
    };

  } catch (error) {
    console.error('Error in removeUsersFromIframeIfExists:', error);
    return {
      isIframe: false,
      iframe: null,
      message: `Error: ${error.message}`
    };
  }
};
