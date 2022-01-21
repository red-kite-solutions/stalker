
import { HttpException } from "@nestjs/common";
import { isDocument } from "@typegoose/typegoose";
import { Domain } from "src/modules/database/reporting/domain/domain.model";
import { Program } from "src/modules/database/reporting/program.model";


// Functions that help work with a Program and its tree of Domains, as it needs 
// recursivity to be worked with. With these functions, it is possible to work
// with the domain tree by using domain name strings like "sub2.sub1.example.com"
export namespace DomainTreeUtils {

    // Extracts subdomains to a reversed array of strings to be suitable to use with the Domain tree
    // domainName : A string with the format sub2.sub1.example.com
    // returns : A string array like ["example.com", "sub1", "sub2"]
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

    // Called when a subdomain is not found in "the domains" tree
    // The function adds the subdomains to the tree
    // domains : The domain tree at the branch where we are
    // subdomains : The subdomains to add or that were already there
    // currentIndex : The index in subdomains that the function needs to add to the tree
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

    // Goes through the domain tree "domains" to find the different given subdomains
    // If it can't find a subdomain, it calls recursiveExpandDomainTree to add Domain nodes to the tree
    // domains : The domain tree at the branch where we are
    // subdomains : The subdomains to add or that were already there
    // currentIndex : The index in subdomains that the function needs to add or locate in the tree
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
    // program : Represents a bug bounty program, contains an array of domains
    // fullDomainName : A full domain name to add to the program if it was not already found. 
    //                  Respects the format sub2.sub1.example.com
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