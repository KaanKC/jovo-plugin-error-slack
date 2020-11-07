import { PluginConfig } from 'jovo-core';

export interface IConfig extends PluginConfig {
  webhookUrl: string,
  channel?: string,
  fallback?: string,
  color?: string,
  pretext?: string, 
  author_name?: string,
  author_link?: string,
  author_icon?: string,
  title?: string,
  title_link?: string,
  text?: string,
  image_url?: string,
  thumb_url?: string,
  footer?: string,
  footer_icon?: string,
}

export interface IBaseLog {
 channel?: string;
 attachments: IAttachment[];
}

interface IAttachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  fields: IField[];
}

interface IField {
  title: string;
  value?: string;
  short: boolean;
}