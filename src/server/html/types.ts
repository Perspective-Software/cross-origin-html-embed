export type GenerateBaseOptions = {
  name?: string;
  canonicalUrl?: URL;
  favicon?: {
    type: string;
    href: string;
  };
  hideBranding?: boolean;
  extendHead?: string;
  extendBody?: string;
};

export type GenerateForOriginWhitelistOptions = GenerateBaseOptions & {
  allowAllOrigins: false;
  originWhitelist: string[];
};

export type GenerateForAllOriginsOptions = GenerateBaseOptions & {
  allowAllOrigins: true;
};

export type GenerateIframeHtmlOptions =
  | GenerateForOriginWhitelistOptions
  | GenerateForAllOriginsOptions;
