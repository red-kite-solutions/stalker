export let reportTemplate: string = `
# Stalker - Recon Automation | Daily Report

This report contains anything new that was found on the following date: 

**{{date}}**

Information in this report was unknown to Stalker before that date.


{{#comments}}
## Report Comments

* {{.}}
{{/comments}}

{{#company}}

## {{name}}

The following domains were found : 

|Domain Name|IP Address|Identified Services|
|-----------|----------|-------------------|
{{#domains}}|{{name}}|{{ips}}|{{services}}|{{/domains}}

The following hosts were found : 

|IP Address|Ports|Identified Services|
|----------|-----|-------------------|
{{#hosts}}|{{ip}}|{{ports}}|{{services}}|{{/hosts}}

{{/company}}

`;
