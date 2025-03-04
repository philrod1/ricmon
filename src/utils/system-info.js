const os = require('os');

/**
 * Get the IP address of the host machine
 * @param {string} [interfaceName=null] - Optional network interface name
 * @returns {string} IP address
 */
function getIpAddress(interfaceName = null) {
  const interfaces = os.networkInterfaces();
  
  // If a specific interface is requested
  if (interfaceName && interfaces[interfaceName]) {
    const interface = interfaces[interfaceName];
    const ipv4 = interface.find(addr => addr.family === 'IPv4' && !addr.internal);
    if (ipv4) return ipv4.address;
  }
  
  // Otherwise find the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    const interface = interfaces[name];
    const ipv4 = interface.find(addr => addr.family === 'IPv4' && !addr.internal);
    if (ipv4) return ipv4.address;
  }
  
  return '127.0.0.1'; // Fallback to localhost
}

/**
 * Get environment variables with fallback values
 * @param {string} name - Environment variable name
 * @param {any} defaultValue - Default value if not found
 * @returns {any} The environment variable value or default
 */
function getEnvVar(name, defaultValue = null) {
  return process.env[name] || defaultValue;
}

module.exports = {
  getIpAddress,
  getEnvVar
};
