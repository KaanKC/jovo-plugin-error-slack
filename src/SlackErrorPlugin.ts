import { Jovo, Plugin, BaseApp, HandleRequest, HttpService, Host } from 'jovo-core';
import _get = require('lodash.get');

import { IBaseLog, IConfig } from './Interfaces';

const jovoLogo16x16URL = 'https://raw.githubusercontent.com/jovotech/jovo-framework-nodejs/master/docs/img/jovo-logo-16x16.png';


export class SlackErrorPlugin implements Plugin {

    // default config
    config: IConfig = {
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
        // errors
        app.middleware('fail')!.use(this.error.bind(this));
        // SessionEndedRequest
        app.middleware('platform.nlu')!.use(this.sessionEndedRequest.bind(this));
    }

    uninstall(app: BaseApp){

    }

    sessionEndedRequest(handleRequest: HandleRequest) {
        if (!handleRequest.jovo) {
            return;
        }
        if (handleRequest.jovo.constructor.name !== 'AlexaSkill') {
            return;
        }
        const request = JSON.parse(JSON.stringify(handleRequest.jovo.$request!));
        if (_get(request, 'request.type') === 'SessionEndedRequest') {
            // not user initiated, i.e. there was an error
            if (_get(request, 'request.reason') === 'ERROR') {
                const log = this.createSessionEndedLog(handleRequest);
                this.sendRequest(log);
            }
        }
    }
    
    createSessionEndedLog(handleRequest: HandleRequest) {
        let log = this.getBaseLog(handleRequest.jovo!);
        log.attachments[0].fields.push(       
            {
                "title": "RequestId",
                "value": handleRequest.jovo!.$request!.toJSON().request.requestId,
                "short": false
            },                 {
                "title": "Error Type",
                "value": handleRequest.jovo!.$request!.toJSON().request.error.type,
                "short": true
            },
            {
                "title": "Error Message",
                "value": handleRequest.jovo!.$request!.toJSON().request.error.message,
                "short": true
            }
        );

        // if the host is lambda, we extract the cloudwatch log link and add it to the logs
        if (handleRequest.host.constructor.name === 'Lambda') {
            log = this.addCloudWatchUrl(log, handleRequest.host);
        }

        return log;
    }
    /**
     * Will be called every time an error occurs
     * @param handleRequest contains current app?, host?, jovo? and error? instance
     */
    async error(handleRequest: HandleRequest): Promise<void> {
        if (!handleRequest.jovo) {
            return;
        }
        const log = this.createErrorLog(handleRequest);
        await this.sendRequest(log);
    }

    /**
     * Creates message for Slack
     * @param handleRequest 
     */
    createErrorLog(handleRequest: HandleRequest): object {
        let log = this.getBaseLog(handleRequest.jovo!);
        log.attachments[0].fields.push(
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
        );

        // if the host is lambda, we extract the cloudwatch log link and add it to the logs
        if (handleRequest.host.constructor.name === 'Lambda') {
            log = this.addCloudWatchUrl(log, handleRequest.host);
        }

        return log;
    }

    private addCloudWatchUrl(log: IBaseLog, host: Host) {
        const cloudwatchUrl = this.getCloudwatchUrl(host);
        const cloudwatchField = {
            "title": "Cloudwatch URL",
            "value": `<${cloudwatchUrl}|Cloudwatch Log URL>`,
            "short": true
        }
        log.attachments[0].fields.push(cloudwatchField);

        return log;
    }

    private getBaseLog(jovo: Jovo): IBaseLog {
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
                            "value": jovo.$user!.getId(),
                            "short": false
                        },
                        {
                            "title": "Timestamp",
                            "value": jovo.$request!.getTimestamp(),
                            "short": true
                        },
                        {
                            "title": "Locale",
                            "value": jovo.$request!.getLocale(),
                            "short": true
                        },
                        {
                            "title": "Platform",
                            "value": jovo.constructor.name,
                            "short": false
                        },
                    ],
                },
            ],
        };

        return log;
    }

    /**
     * Returns the cloudwatch url of the log insights for the specific AWS request ID.
     * See Stackoverflow link for examples of Cloudwatch's URL encoding
     * @param host Lambda class from jovo-framework
     * @see https://stackoverflow.com/questions/60796991/is-there-a-way-to-generate-the-aws-console-urls-for-cloudwatch-log-group-filters
     */
    getCloudwatchUrl(host: any): string {
        const awsRequestId = host.context.awsRequestId;
        const region = host.context.invokedFunctionArn.split(':')[3]; // e.g. arn:aws:lambda:eu-west-1:820261819571:function:testName
        const logGroupName = host.context.logGroupName;
        const logStreamName = host.context.logStreamName
        const baseUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/`;
        const logGroup = `${logGroupName.replace(/\//g, '$252F')}/log-events/`;
        const logStream = `${logStreamName!.replace('$', '$2524').replace('[', '$255B').replace(']', '$255D').replace(/\//g, '$252F')}`;
        const filterPattern = `$3Ffilterpattern$3D$252${awsRequestId}`
        
        return baseUrl + logGroup + logStream + filterPattern;
    }

    /**
     * Sends out the request to the Slack API
     * @param log message, which will be sent to Slack
     */
    private async sendRequest(log: object): Promise<void> {
        await HttpService.post(this.config.webhookUrl, log);
    }
}