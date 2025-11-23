from __future__ import annotations
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


    def test_convert_value_and_generated_code(self):
        # Arrange
        from dataclasses import dataclass
        from typing import Any, Dict, List, Optional, Union
        from stalker_job_sdk import convert_value

        #region Auto-generated code
        CLASS_REGISTRY: Dict[str, type] = {}

        @dataclass
        class Root:
            a: int
            b: str
            sub_class_2: SubClass2
            sub_classes: List[SubClass]
            sub_classes_lists: List[List[SubClassesList]]

            @classmethod
            def from_dict(cls, obj: Dict[str, Any]) -> Root:
                if obj is None:
                    return None
                _a = convert_value(obj.get('a'), 'int', CLASS_REGISTRY)
                _b = convert_value(obj.get('b'), 'str', CLASS_REGISTRY)
                _sub_class_2 = convert_value(obj.get('sub_class_2'), 'SubClass2', CLASS_REGISTRY)
                _sub_classes = convert_value(obj.get('sub_classes'), 'List[SubClass]', CLASS_REGISTRY)
                _sub_classes_lists = convert_value(obj.get('sub_classes_lists'), 'List[List[SubClassesList]]', CLASS_REGISTRY)
                return cls(a=_a, b=_b, sub_class_2=_sub_class_2, sub_classes=_sub_classes, sub_classes_lists=_sub_classes_lists)

        @dataclass
        class SubClass:
            a: int
            b: str

            @classmethod
            def from_dict(cls, obj: Dict[str, Any]) -> SubClass:
                if obj is None:
                    return None
                _a = convert_value(obj.get('a'), 'int', CLASS_REGISTRY)
                _b = convert_value(obj.get('b'), 'str', CLASS_REGISTRY)
                return cls(a=_a, b=_b)

        @dataclass
        class SubClass2:
            a: int
            sub_class: SubClass

            @classmethod
            def from_dict(cls, obj: Dict[str, Any]) -> SubClass2:
                if obj is None:
                    return None
                _a = convert_value(obj.get('a'), 'int', CLASS_REGISTRY)
                _sub_class = convert_value(obj.get('sub_class'), 'SubClass', CLASS_REGISTRY)
                return cls(a=_a, sub_class=_sub_class)

        @dataclass
        class SubClassesList:
            a: int
            b: str

            @classmethod
            def from_dict(cls, obj: Dict[str, Any]) -> SubClassesList:
                if obj is None:
                    return None
                _a = convert_value(obj.get('a'), 'int', CLASS_REGISTRY)
                _b = convert_value(obj.get('b'), 'str', CLASS_REGISTRY)
                return cls(a=_a, b=_b)

        # populate CLASS_REGISTRY
        for _c in (
            Root,
            SubClass,
            SubClass2,
            SubClassesList,
        ):
            CLASS_REGISTRY[_c.__name__] = _c

        def load_root_from_dict(d: Dict[str, Any]) -> Root:
            return Root.from_dict(d)
        #endregion

        obj_to_load = {
            "a": 1,
            "b": "asdf",
            "sub_class_2": {
                "a": 1,
                "sub_class": {
                    "a": 1,
                    "b": "hello"
                }
            },
            "sub_classes": [
                {
                    "a":0,
                    "b": "qwerty"
                },
                {
                    "a":1,
                    "b": "uiop"
                }
            ],
            "sub_classes_lists": [
                [
                    {
                        "a":0,
                        "b": "qwerty"
                    },
                    {
                        "a":1,
                        "b": "uiop"
                    }
                ],
                [
                    {
                        "a":2,
                        "b": "qwerty"
                    },
                    {
                        "a":3,
                        "b": "uiop"
                    }
                ]
            ]
        }

        # Act
        loaded_obj = load_root_from_dict(obj_to_load)
        
        # Assert
        self.assertEqual(loaded_obj.a, obj_to_load["a"])
        self.assertEqual(loaded_obj.b, obj_to_load["b"])
        self.assertEqual(loaded_obj.sub_class_2.a, obj_to_load["sub_class_2"]["a"])
        self.assertEqual(loaded_obj.sub_class_2.sub_class.a, obj_to_load["sub_class_2"]["sub_class"]["a"])
        self.assertEqual(loaded_obj.sub_class_2.sub_class.b, obj_to_load["sub_class_2"]["sub_class"]["b"])
        self.assertEqual(loaded_obj.sub_classes_lists[0][0].a, obj_to_load["sub_classes_lists"][0][0]["a"])
        self.assertEqual(loaded_obj.sub_classes_lists[0][0].b, obj_to_load["sub_classes_lists"][0][0]["b"])
        self.assertEqual(loaded_obj.sub_classes_lists[0][1].a, obj_to_load["sub_classes_lists"][0][1]["a"])
        self.assertEqual(loaded_obj.sub_classes_lists[0][1].b, obj_to_load["sub_classes_lists"][0][1]["b"])
        self.assertEqual(loaded_obj.sub_classes_lists[1][0].a, obj_to_load["sub_classes_lists"][1][0]["a"])
        self.assertEqual(loaded_obj.sub_classes_lists[1][0].b, obj_to_load["sub_classes_lists"][1][0]["b"])
        self.assertEqual(loaded_obj.sub_classes_lists[1][1].a, obj_to_load["sub_classes_lists"][1][1]["a"])
        self.assertEqual(loaded_obj.sub_classes_lists[1][1].b, obj_to_load["sub_classes_lists"][1][1]["b"])
    





if __name__ == '__main__':
    unittest.main(verbosity=2)