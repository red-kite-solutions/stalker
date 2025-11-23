import unittest
from stalker_job_sdk import get_all_domains

class TestSdkMethods(unittest.TestCase):
    def test_get_all_domains(self):
        # Arrange
        domains = [
            "asdf.example.com", 
            "example.co.uk", 
            "asdf.asdf.example.co.uk", 
            "*.star.hello.com", 
            "dot.qwerty.com.", 
            "asdf.asdf.example.com"
        ]
        expected_response = sorted([
            "asdf.example.com",
            "example.com",
            "example.co.uk",
            "asdf.asdf.example.co.uk",
            "asdf.example.co.uk",
            "star.hello.com",
            "hello.com",
            "dot.qwerty.com",
            "qwerty.com",
            "asdf.asdf.example.com"
        ])

        # Act
        all_domains = get_all_domains(domains)

        # Assert
        self.assertEqual(sorted(all_domains), sorted(expected_response))

if __name__ == '__main__':
    unittest.main(verbosity=2)