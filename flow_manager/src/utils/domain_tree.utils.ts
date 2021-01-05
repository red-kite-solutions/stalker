
import { HttpException } from "@nestjs/common";
import { isDocument } from "@typegoose/typegoose";
import { Domain } from "src/modules/database/reporting/domain/domain.model";
import { Program } from "src/modules/database/reporting/program.model";

export namespace DomainTreeUtils {

    function domainNameToReversedStringArray(domainName: string) {
        // "sub2.sub1.example.com"
        let splitDomains = domainName.split('.');
        // ["sub2", "sub1", "example", "com"]
        splitDomains[splitDomains.length - 2] = splitDomains[splitDomains.length - 2] + '.' + splitDomains[splitDomains.length - 1];
        // ["sub2", "sub1", "example.com", "com"]
        splitDomains.pop();
        // ["sub2", "sub1", "example.com"]
        return splitDomains.reverse();
        // ["example.com", "sub1", "sub2"]
    }

    function recursiveExpandDomainTree(domains: Domain[], subdomains: string[], currentIndex: number = 0) {
        if(currentIndex >= subdomains.length) {
            return;
        }
        let newDomain = new Domain();
        newDomain.name = subdomains[currentIndex];
        newDomain.isRawIp = false;
        newDomain.subdomains = [];

        domains.push(newDomain);
        recursiveExpandDomainTree(domains[domains.length - 1].subdomains, subdomains, currentIndex + 1);
    }

    function recursiveGrowDomainTree(domains: Domain[], subdomains: string[], currentIndex: number = 0) {
        // return condition
        if(currentIndex >= subdomains.length) {
            return;
        }

        let isFound = false;
        domains.forEach((domain, i) => {
            if(domain.name === subdomains[currentIndex]) {
                isFound = true;
                recursiveGrowDomainTree(domain.subdomains, subdomains, currentIndex + 1);
                return;
            }
        });
        if(!isFound) {
            recursiveExpandDomainTree(domains, subdomains, currentIndex);
        }
    }

    // A recursive function that expands the Domain tree contained in program if the fullDomainName 
    // contains a domain or sub-domain that is not yet included in the current tree.
    // It basically creates a tree with Domain objects as nodes.
    // fullDomainName has the following format: sub2.sub1.example.com
    export function growDomainTree(program: Program, fullDomainName: string) {
        let reversedDomainNameArray = domainNameToReversedStringArray(fullDomainName);
        if(program.domains) {
            recursiveGrowDomainTree(program.domains, reversedDomainNameArray);
        } else {
            program.domains = [];
            recursiveExpandDomainTree(program.domains, reversedDomainNameArray);
        }
    }

    function recursiveFindDomainObject(domain: Domain, subdomains: string[], currentIndex: number = 0): Domain {
        // return condition
        if(currentIndex >= subdomains.length) {
            return domain;
        }
        // domain has no following subdomains, but we are not done yet with subdomains
        if(!domain.subdomains) {
            throw new HttpException("The given subdomain is not part of the given program. Maybe it needs to be added.", 500);
        }
        domain.subdomains.forEach((subdomain, index) => {
            if(subdomain.name === subdomains[currentIndex]) {
                return recursiveFindDomainObject(subdomain, subdomains, currentIndex + 1);
            }
        });
        throw new HttpException("The given subdomain is not part of the given program. Maybe it needs to be added.", 500)
    }
    // Used to find a domain object that we want to work with when given a program and a full domain name
    // fullDomainName has the following format: sub2.sub1.example.com
    export function findDomainObject(program: Program, fullDomainName: string): Domain {
        let reversedStringArray = domainNameToReversedStringArray(fullDomainName);
        program.domains.forEach((domain, index)=> {
            if(domain.name === reversedStringArray[0]) {
                return recursiveFindDomainObject(domain, reversedStringArray, 1);
            }
        });
        throw new HttpException("The given subdomain is not part of the given program. Maybe it needs to be added.", 500)
    }
}