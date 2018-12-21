import { PluginConfig, Plugin, BaseApp, HandleRequest } from 'jovo-core';
import request = require('request');

const jovoLogo16x16URL = 'https://raw.githubusercontent.com/jovotech/jovo-framework-nodejs/master/docs/img/jovo-logo-16x16.png';

export interface Config extends PluginConfig {
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


export class SlackErrorPlugin implements Plugin {

    // default config
    config: Config = {
        webhookUrl: '',
        channel: '',
        fallback: 'Error Message',
        color: '#ff0000',
        pretext: '', 
        author_name: '',
        author_link: '',
        author_icon: '',
        title: 'An error has occured!',
        title_link: '',
        text: '',
        image_url: '',
        thumb_url: '',
        footer: 'Jovo Plugin - Slack Error',
        footer_icon: jovoLogo16x16URL,
    };

    constructor() {

    }

    /**
     * Hooks up plugin to the "fail" middleware
     * @param app 
     */
    install(app: BaseApp) {
        app.middleware('fail')!.use(this.log.bind(this));
    }

    uninstall(app: BaseApp){

    }
    
    /**
     * Will be called every time an error occurs
     * @param handleRequest contains current app?, host?, jovo? and error? instance
     */
    log(handleRequest: HandleRequest): void {
        if (!handleRequest.jovo) {
            return;
        }
        const log = this.createLog(handleRequest);
        this.sendRequest(log);
    }

    /**
     * Creates message for Slack
     * @param handleRequest 
     */
    createLog(handleRequest: HandleRequest): object {
        const log = {
            "channel": this.config.channel,
            "attachments": [
                {
                    "fallback": this.config.fallback,
                    "color": this.config.color,
                    "pretext": this.config.pretext,
                    "author_name": this.config.author_name,
                    "author_link": this.config.author_link,
                    "author_icon": this.config.author_icon,
                    "title": this.config.title,
                    "title_link": this.config.title_link,
                    "text": this.config.text,
                    "image_url": this.config.image_url,
                    "thumb_url": this.config.thumb_url,
                    "footer": this.config.footer,
                    "footer_icon": this.config.footer_icon,
                    "fields": [
                        {
                            "title": "UserID",
                            "value": handleRequest.jovo!.$user!.getId(),
                            "short": false
                        },
                        {
                            "title": "Timestamp",
                            "value": handleRequest.jovo!.$request!.getTimestamp(),
                            "short": true
                        },
                        {
                            "title": "Locale",
                            "value": handleRequest.jovo!.$request!.getLocale(),
                            "short": true
                        },
                        {
                            "title": "Platform",
                            "value": handleRequest.jovo!.constructor.name,
                            "short": false
                        },
                        {
                            "title": "State",
                            "value": handleRequest.jovo!.getState() ? handleRequest.jovo!.getState() : "-",
                            "short": true
                        },
                        {
                            "title": "Intent",
                            "value": handleRequest.jovo!.$request!.getIntentName(),
                            "short": true
                        },
                        {
                            "title": "Error Message",
                            "value": handleRequest.error!.stack,
                            "short": false
                        }
                    ]
                }
            ]
        }
        return log;
    }

    /**
     * Sends out the request to the Slack API
     * @param log message, which will be sent to Slack
     */
    sendRequest(log: object): void {
        request({
            uri: this.config.webhookUrl!,
            method: 'POST',
            json: true,
            body: log
        }, function (error, response, body) {
            if (error) {
                console.log(error);
            }
        });
    }    
}