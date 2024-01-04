import json
import unittest

from nuclei_finding import NucleiFinding


class NucleiFindingsMethods(unittest.TestCase):
    domain_test_cases: list
    host_test_cases: list
    port_test_cases: list

    def __init__(self, a):
        test_cases = {}
        with open('./test_dataset.json', 'r') as f:
            text = "".join(f.readlines())
            test_cases = json.loads(text)
        
        self.domain_test_cases = test_cases.get("domain")
        self.host_test_cases = test_cases.get("host")
        self.port_test_cases = test_cases.get("port")
            
        super().__init__(a)

    # def setUp(self):
    #     print("setup, called before every test")

    # def tearDown(self):
    #     print("teardown, called after every test")

    def test_init_NucleiFinding_class_domains(self):
        for domain_finding in self.domain_test_cases:
            d = NucleiFinding(domain_finding)
            self.assertIsInstance(d, NucleiFinding)

    def test_init_NucleiFinding_class_hosts(self):
        for host_finding in self.host_test_cases:
            h = NucleiFinding(host_finding)
            self.assertIsInstance(h, NucleiFinding)

    def test_init_NucleiFinding_class_ports(self):
        for port_finding in self.port_test_cases:
            p = NucleiFinding(port_finding)
            self.assertIsInstance(p, NucleiFinding)

if __name__ == '__main__':
    unittest.main()