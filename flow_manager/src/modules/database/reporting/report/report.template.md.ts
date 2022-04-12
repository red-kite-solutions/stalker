export let reportTemplate: string = `
# Stalker - Recon Automation | Daily Report

This report contains anything new that was found on the following date: 

**{{date}}**

Information in this report was unknown to Stalker before that date.
{{#comments.length}}

## Report Comments

{{/comments.length}}
{{#comments}}* {{.}}
{{/comments}}
{{#companies}}

## {{name}}

{{#domains.length}}
The following domains were found : 

|Domain Name|IP Address|Identified Services|
|-----------|----------|-------------------|
{{/domains.length}}
{{#domains}}
|{{name}}|{{ips}}|{{services}}|
{{/domains}}

{{#hosts.length}}
The following hosts were found : 

|IP Address|Ports|Identified Services|
|----------|-----|-------------------|
{{/hosts.length}}
{{#hosts}}
|{{ip}}|{{ports}}|{{services}}|
{{/hosts}}

{{/companies}}

`;
