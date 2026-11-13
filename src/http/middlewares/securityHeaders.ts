import type { RequestHandler } from 'express';
import helmet from 'helmet';

const DENIED_FEATURES = [
  'accelerometer', 'camera', 'display-capture', 'fullscreen', 'geolocation', 'gyroscope',
  'magnetometer', 'microphone', 'payment', 'usb', 'clipboard-read', 'clipboard-write'
];

/**
 * Returns the security header middlewares: helmet plus Permissions-Policy and Cache-Control
 */
export const securityHeaders = (): RequestHandler[] => [
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true },
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' }
  }),
  (_req, res, next) => {
    res.setHeader('Permissions-Policy', DENIED_FEATURES.map((feature) => `${feature}=()`).join(', '));
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    next();
  }
];
