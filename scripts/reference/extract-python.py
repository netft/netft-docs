from __future__ import annotations

import ast
import json
import sys
from pathlib import Path


def annotation(node: ast.expr | None) -> str:
    return "" if node is None else ast.unparse(node)


def exported_names(package: Path) -> dict[str, tuple[str, str]]:
    tree = ast.parse((package / "__init__.py").read_text())
    imports: dict[str, tuple[str, str]] = {}
    public: set[str] = set()
    for node in tree.body:
        if isinstance(node, ast.ImportFrom) and node.module:
            module = node.module.lstrip(".")
            for item in node.names:
                imports[item.asname or item.name] = (module, item.name)
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == "__all__" for target in node.targets
        ):
            public = {value.value for value in node.value.elts if isinstance(value, ast.Constant)}
    return {name: imports[name] for name in public if name in imports}


def method(node: ast.FunctionDef | ast.AsyncFunctionDef) -> dict:
    positional = [*node.args.posonlyargs, *node.args.args]
    defaults = [None] * (len(positional) - len(node.args.defaults)) + list(node.args.defaults)
    parameters = []
    for argument, default in zip(positional, defaults):
        if argument.arg in {"self", "cls"}:
            continue
        item = {"name": argument.arg, "type": annotation(argument.annotation)}
        if default is not None:
            item["default"] = ast.unparse(default)
        parameters.append(item)
    for argument, default in zip(node.args.kwonlyargs, node.args.kw_defaults):
        item = {"name": argument.arg, "type": annotation(argument.annotation)}
        if default is not None:
            item["default"] = ast.unparse(default)
        parameters.append(item)
    rendered = ", ".join(
        f"{item['name']}: {item['type']}" + (f" = {item['default']}" if "default" in item else "")
        for item in parameters
    )
    return_type = annotation(node.returns) or "Any"
    return {
        "id": node.name,
        "name": node.name,
        "signature": f"{node.name}({rendered}) -> {return_type}",
        "returnType": return_type,
        "parameters": parameters,
        "qualifiers": ["async"] if isinstance(node, ast.AsyncFunctionDef) else [],
        "throws": [],
    }


def symbol(package: Path, public_name: str, module: str, source_name: str) -> dict:
    path = package / f"{module.replace('.', '/')}.py"
    tree = ast.parse(path.read_text())
    node = next(
        item
        for item in tree.body
        if isinstance(item, ast.ClassDef) and item.name == source_name
    )
    bases = [ast.unparse(base) for base in node.bases]
    decorators = [ast.unparse(item) for item in node.decorator_list]
    if any(base.endswith("Enum") for base in bases):
        category = "enum"
    elif any(base.endswith("Error") or base.endswith("Exception") for base in bases):
        category = "exception"
    elif any(item.startswith("dataclass") for item in decorators):
        category = "dataclass"
    else:
        category = "class"
    fields = []
    values = []
    methods = []
    for item in node.body:
        if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
            field = {
                "name": item.target.id,
                "type": annotation(item.annotation),
                "mutable": not any("frozen=True" in value for value in decorators),
            }
            if item.value is not None:
                field["default"] = ast.unparse(item.value)
            fields.append(field)
        elif isinstance(item, ast.Assign) and category == "enum":
            for target in item.targets:
                if isinstance(target, ast.Name):
                    values.append({"name": target.id, "value": ast.literal_eval(item.value)})
        elif isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and not item.name.startswith("_"):
            methods.append(method(item))
        elif isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == "__init__":
            methods.insert(0, method(item) | {"id": public_name, "name": public_name})
    declaration = f"class {public_name}" + (f"({', '.join(bases)})" if bases else "")
    return {
        "id": f"pynetft.{public_name}",
        "name": public_name,
        "qualifiedName": f"pynetft.{public_name}",
        "category": category,
        "declaration": declaration,
        "sourcePath": f"src/pynetft/{module.replace('.', '/')}.py",
        "importPath": f"from pynetft import {public_name}",
        "fields": fields,
        "methods": methods,
        "values": values,
        "bases": bases,
    }


def main() -> None:
    root = Path(sys.argv[1])
    package = root / "src/pynetft"
    metadata = json.loads(sys.argv[2])
    exports = exported_names(package)
    symbols = [symbol(package, name, *exports[name]) for name in sorted(exports)]
    print(json.dumps({
        "schemaVersion": 1,
        "kind": "python-api",
        "component": "pyNetFT",
        **metadata,
        "symbols": symbols,
    }))


if __name__ == "__main__":
    main()
