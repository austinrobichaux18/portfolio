import { PythonLesson } from '../models/PythonLesson';

export const PYTHON_LESSONS: PythonLesson[] = [
  {
    id: 'type-system',
    title: 'Type System & Variables',
    description: 'Variable declarations, type inference, null vs None, and string formatting.',
    comparisons: [
      {
        title: 'Variable Declarations',
        description:
          'C# requires a type keyword or `var` to declare a variable. Python has no declaration step — you just assign.',
        csharp: `// Explicit type or var
string name = "Alice";
int count = 42;
var inferred = 3.14;  // double

// Constants
const int MaxRetries = 3;`,
        python: `# No declaration keyword needed
name = "Alice"
count = 42
inferred = 3.14  # float

# Constants are a convention, not enforced
MAX_RETRIES = 3`,
        notes: [
          'Python has no `var`, `let`, or `const` — just assign.',
          "Constants are named `ALL_CAPS` by convention but the language won't stop you from reassigning them.",
          "Python's `float` is always 64-bit (C#'s `double`). There is no separate `float` vs `double`.",
          'Type hints are optional but recommended: `name: str = "Alice"` — useful for tooling and readability.',
        ],
      },
      {
        title: 'Null vs None',
        description:
          'C# has `null` with nullable types (`string?`, `int?`). Python uses `None` and any variable can hold it.',
        csharp: `string? name = null;

if (name != null)
{
    Console.WriteLine(name.Length);
}

// Null-coalescing
string display = name ?? "Anonymous";

// Null-conditional
int? len = name?.Length;`,
        python: `name = None

if name is not None:
    print(len(name))

# Equivalent of null-coalescing
display = name if name is not None else "Anonymous"
# Shorter falsy fallback (careful: "" and 0 also trigger this)
display = name or "Anonymous"

# No ?. operator — check first
length = len(name) if name is not None else None`,
        notes: [
          'Use `is None` / `is not None` — not `== None`. It tests identity and is the PEP 8 convention.',
          "Python has no `?.` null-conditional operator — you check explicitly with an `if`.",
          '`x or "default"` is handy but treats `0`, `""`, and `[]` as falsy too — not the same as `x ?? "default"`.',
          'Any variable can hold `None` — there are no non-nullable reference types.',
        ],
      },
      {
        title: 'String Formatting',
        description:
          'C# string interpolation (`$"..."`) and Python f-strings are nearly identical in concept and syntax.',
        csharp: `string name = "Alice";
int score = 95;

// String interpolation (preferred)
string msg = $"Player {name} scored {score} points.";

// With format specifier
string pct = $"Accuracy: {score / 100.0:P1}";
string dec = $"Value: {3.14159:F2}";`,
        python: `name = "Alice"
score = 95

# f-strings (preferred, Python 3.6+)
msg = f"Player {name} scored {score} points."

# With format specifier — Python's mini-language
pct = f"Accuracy: {score / 100:.1%}"
dec = f"Value: {3.14159:.2f}"`,
        notes: [
          'F-strings are Python\'s `$"..."` — prefix the string with `f` and use `{}` the same way.',
          "Format specs inside `{}` use Python's format mini-language: `:.2f` (2 decimals), `:.1%` (percentage), `:,` (thousands separator).",
          'Older Python code uses `"Hello %s" % name` or `"Hello {}".format(name)` — you\'ll see these in legacy code.',
          'C# `:P1` → Python `:.1%`; C# `:F2` → Python `:.2f`. The precision number means the same thing.',
        ],
      },
    ],
    quiz: [
      {
        question: 'What is the Python equivalent of C#\'s `null`?',
        options: ['undefined', 'None', 'void', 'nil'],
        correctIndex: 1,
        explanation:
          "Python uses `None` as the absent/null value. Unlike C#, there's no nullable type distinction — any variable can be `None`.",
      },
      {
        question: 'Which Python idiom is preferred for checking if a variable is None?',
        options: ['if x == None:', 'if not x:', 'if x is None:', 'if x === None:'],
        correctIndex: 2,
        explanation:
          '`is None` tests identity, which is the correct and PEP 8-recommended way. `== None` works but is discouraged. `not x` is too broad — it\'s `True` for `0`, `""`, and `[]` as well.',
      },
      {
        question: 'What does `f"Score: {value:.1f}"` produce when `value = 95.678`?',
        options: ['Score: 95.678', 'Score: 96.0', 'Score: 95.7', 'Score: 95.6'],
        correctIndex: 2,
        explanation:
          '`:.1f` formats as a float with 1 decimal place, rounding to `95.7`. This mirrors C#\'s `:F1` format specifier.',
      },
    ],
  },
  {
    id: 'collections',
    title: 'Collections & LINQ',
    description: 'Lists, dictionaries, and replacing LINQ with Python comprehensions.',
    comparisons: [
      {
        title: 'Lists (List<T>)',
        description:
          'C#\'s `List<T>` maps closely to Python\'s built-in `list`. The API is similar but method names differ.',
        csharp: `var items = new List<string> { "apple", "banana", "cherry" };
items.Add("date");
items.Remove("banana");

int count = items.Count;
bool has = items.Contains("apple");

string first = items[0];
string last = items[items.Count - 1];`,
        python: `items = ["apple", "banana", "cherry"]
items.append("date")
items.remove("banana")

count = len(items)
has = "apple" in items

first = items[0]
last = items[-1]  # negative index: -1 = last`,
        notes: [
          '`len(items)` replaces `.Count` — `len()` is a built-in function, not a property.',
          '`.append()` replaces `.Add()`. `.extend([...])` adds multiple items (like `.AddRange`).',
          'Python supports negative indexing: `items[-1]` is the last element, `items[-2]` is second-to-last.',
          'Python lists are untyped — they can hold mixed types. Use `list[str]` in type hints for clarity.',
        ],
      },
      {
        title: 'Dictionaries (Dictionary<K, V>)',
        description:
          'Python\'s `dict` is the equivalent of `Dictionary<K, V>`, with a cleaner safe-access API.',
        csharp: `var scores = new Dictionary<string, int>
{
    { "Alice", 95 },
    { "Bob", 87 }
};

scores["Charlie"] = 92;

// Safe lookup
if (scores.TryGetValue("Alice", out int val))
{
    Console.WriteLine(val);
}

bool exists = scores.ContainsKey("Alice");`,
        python: `scores = {
    "Alice": 95,
    "Bob": 87,
}

scores["Charlie"] = 92

# Safe lookup — returns None (or a default) if missing
val = scores.get("Alice")
val = scores.get("Dave", 0)  # default = 0

# Check key existence
if "Alice" in scores:
    print(scores["Alice"])`,
        notes: [
          '`dict.get(key)` returns `None` if missing — no `TryGetValue` needed.',
          '`dict.get(key, default)` is the cleanest safe-access pattern (equivalent to `TryGetValue` + null-coalescing).',
          'Accessing a missing key with `dict[key]` raises `KeyError` — the equivalent of `KeyNotFoundException`.',
          'Dict literal syntax: `{key: value}` uses a colon, not `=`. Trailing commas are allowed (and encouraged).',
        ],
      },
      {
        title: 'LINQ → List Comprehensions',
        description:
          'Python list comprehensions replace `.Where()`, `.Select()`, and most LINQ chains in a single expression.',
        csharp: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

// Where (filter)
var evens = numbers.Where(n => n % 2 == 0).ToList();

// Select (transform)
var doubled = numbers.Select(n => n * 2).ToList();

// Chained: filter then transform
var result = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * 2)
    .ToList();`,
        python: `numbers = [1, 2, 3, 4, 5, 6]

# Where → list comprehension with condition
evens = [n for n in numbers if n % 2 == 0]

# Select → list comprehension transform
doubled = [n * 2 for n in numbers]

# Chained: filter + transform in one expression
result = [n * 2 for n in numbers if n % 2 == 0]`,
        notes: [
          'List comprehension syntax: `[expression for item in iterable if condition]` — transform first, filter last.',
          'For lazy evaluation (like `IEnumerable<T>` without `.ToList()`), use a generator: `(n * 2 for n in numbers)` — parens instead of brackets.',
          '`.Aggregate()` → `sum()`, `min()`, `max()`, or `functools.reduce()` for custom folds.',
          '`.Any(predicate)` → `any(predicate(x) for x in items)`, `.All()` → `all()`.',
        ],
      },
    ],
    quiz: [
      {
        question: 'How do you add a single item to the end of a Python list (equivalent to `list.Add(item)`)?',
        options: ['list.add(item)', 'list.push(item)', 'list.append(item)', 'list += item'],
        correctIndex: 2,
        explanation:
          'Python lists use `.append()` to add one item to the end. `.add()` belongs to `set`. `list += [item]` also works but expects another iterable — less clear for a single item.',
      },
      {
        question: 'What does `scores.get("Dave", 0)` return if `"Dave"` is not in the dictionary?',
        options: ['Raises KeyError', 'Returns None', 'Returns 0', 'Returns False'],
        correctIndex: 2,
        explanation:
          '`.get(key, default)` returns the provided default (`0` here) when the key is missing, instead of raising `KeyError`.',
      },
      {
        question:
          'Which Python expression is equivalent to `numbers.Where(n => n > 3).Select(n => n * 2).ToList()`?',
        options: [
          '[n * 2 where n > 3 in numbers]',
          '[n * 2 for n in numbers if n > 3]',
          'numbers.filter(n > 3).map(n * 2)',
          'map(lambda n: n * 2, filter(lambda n: n > 3, numbers))',
        ],
        correctIndex: 1,
        explanation:
          'A list comprehension handles filter and transform in one expression: `[transform for item in iterable if condition]`. Option D also produces the correct result but is less Pythonic.',
      },
    ],
  },
  {
    id: 'oop',
    title: 'OOP & Classes',
    description: 'Class syntax, constructors, properties, inheritance, and the absence of interfaces.',
    comparisons: [
      {
        title: 'Class Basics & Constructors',
        description:
          'Python classes use `__init__` as the constructor and require explicit `self` on every instance method.',
        csharp: `public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public string Greet() => $"Hi, I'm {Name}.";
}

var p = new Person("Alice", 30);
Console.WriteLine(p.Greet());`,
        python: `class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"Hi, I'm {self.name}."

p = Person("Alice", 30)
print(p.greet())`,
        notes: [
          '`__init__` is the constructor — the double underscores mark it as a "dunder" (magic) method.',
          "Every instance method takes `self` as its first parameter — the explicit version of C#'s implicit `this`.",
          'No access modifiers (`public`, `private`). Prefix private members with `_` by convention.',
          'No `new` keyword — `Person("Alice", 30)` calls the class directly.',
        ],
      },
      {
        title: 'Properties',
        description:
          "Python uses the `@property` decorator in place of C#'s `get`/`set` accessor syntax.",
        csharp: `public class Circle
{
    private double _radius;

    public double Radius
    {
        get => _radius;
        set
        {
            if (value < 0) throw new ArgumentException("Negative radius");
            _radius = value;
        }
    }

    public double Area => Math.PI * _radius * _radius;
}`,
        python: `import math

class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        if value < 0:
            raise ValueError("Negative radius")
        self._radius = value

    @property
    def area(self) -> float:
        return math.pi * self._radius ** 2`,
        notes: [
          '`@property` creates a read-only computed property. Pair it with `@<name>.setter` to make it writable.',
          "No `new` keyword on exceptions: `raise ValueError(...)` vs C#'s `throw new ArgumentException(...)`.",
          '`**` is the exponent operator: `x ** 2` replaces `Math.Pow(x, 2)`.',
          'The `@dataclass` decorator (standard library) auto-generates `__init__`, `__repr__`, and `__eq__` — like a C# record.',
        ],
      },
      {
        title: 'Inheritance & No Interfaces',
        description:
          'Python has no `interface` keyword. Use abstract base classes or duck typing instead.',
        csharp: `public interface IShape
{
    double Area();
}

public class Rectangle : IShape
{
    public double Width { get; }
    public double Height { get; }

    public Rectangle(double w, double h)
    {
        Width = w; Height = h;
    }

    public double Area() => Width * Height;
}`,
        python: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

# Duck typing: no declaration needed.
# If it has area(), it's a "shape" as far as callers care.`,
        notes: [
          'No `interface` keyword. `ABC` + `@abstractmethod` gives you abstract contracts — Python raises `TypeError` if you instantiate an incomplete subclass.',
          'Duck typing: if an object has the required methods/attributes, it works — no explicit interface declaration needed.',
          'Multiple inheritance is allowed: `class C(A, B):`. C# allows only single class inheritance.',
          '`super().__init__(...)` calls the parent constructor — equivalent to `: base(...)` in C#.',
        ],
      },
    ],
    quiz: [
      {
        question: "What is the role of `self` in a Python instance method?",
        options: [
          'A keyword that marks the method as static',
          'A reference to the class itself',
          "The explicit reference to the current instance — equivalent to C#'s implicit `this`",
          'An optional parameter used only in constructors',
        ],
        correctIndex: 2,
        explanation:
          "Python requires every instance method to declare `self` as its first parameter explicitly. The runtime passes the current instance automatically when you call the method — it's the same as C#'s `this`, just made visible.",
      },
      {
        question: 'How do you create a read-only computed property in Python?',
        options: [
          'Prefix the method with `readonly`',
          'Use the `@property` decorator',
          'Return a value from `__getattr__`',
          'Use `get:` inside the class body',
        ],
        correctIndex: 1,
        explanation:
          'The `@property` decorator turns a method into a computed, read-only property accessible without calling parentheses. Add a matching `@<name>.setter` method to make it writable.',
      },
      {
        question: 'How do you signal that a class member is private in Python?',
        options: [
          'Use the `private` keyword before the attribute',
          'Wrap it in `__double__underscores__`',
          'Prefix it with a single underscore, e.g. `_value`',
          'Use the `@private` decorator',
        ],
        correctIndex: 2,
        explanation:
          "A single leading underscore (e.g., `_radius`) is the convention for \"treat this as private.\" Python doesn't enforce it, but other developers and tools respect it. Double underscore `__name` triggers name mangling — a different mechanism.",
      },
    ],
  },
  {
    id: 'functions',
    title: 'Functions',
    description: 'Top-level functions, default parameters, *args/**kwargs, and first-class functions.',
    comparisons: [
      {
        title: 'Function Basics & Type Hints',
        description:
          'Python functions are top-level — no class wrapper needed. Type hints are optional but strongly recommended.',
        csharp: `// Must live inside a class in C#
public static int Add(int a, int b) => a + b;

public static void PrintLine(string text)
{
    Console.WriteLine(text);
}

// Local function
int Calculate(int x, int y) => x * y;`,
        python: `# Top-level — no class required
def add(a: int, b: int) -> int:
    return a + b

def print_line(text: str) -> None:
    print(text)

# Nested function (closure)
def make_multiplier(factor: int):
    def multiply(x: int) -> int:
        return x * factor
    return multiply

double = make_multiplier(2)`,
        notes: [
          'Functions are top-level in Python — no need to wrap them in a static class.',
          'Type hints (`a: int`, `-> int`) are optional but help with tooling and readability.',
          'Indentation defines the function body — no `{}`.',
          'Returning nothing implicitly returns `None` — equivalent to `void`.',
        ],
      },
      {
        title: 'Default Parameters & *args / **kwargs',
        description:
          'Python replaces method overloading with default parameter values and variadic argument syntax.',
        csharp: `// Default parameter values
public static string Greet(string name, string greeting = "Hello")
    => $"{greeting}, {name}!";

// Method overloading (no Python equivalent)
public static void Log(string message)
    => Log(message, "INFO");

public static void Log(string message, string level)
    => Console.WriteLine($"[{level}] {message}");`,
        python: `# Default parameter values (same concept)
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

# *args: variable positional args (like C# params)
# **kwargs: variable keyword args (no C# equivalent)
def log(*messages: str, level: str = "INFO") -> None:
    for msg in messages:
        print(f"[{level}] {msg}")

log("Starting up", "Connecting")
log("Error occurred", level="ERROR")

# Keyword arguments — order doesn't matter
greet(greeting="Hi", name="Alice")`,
        notes: [
          'No method overloading — use default parameters, `*args`, or `**kwargs` instead.',
          '`*args` collects extra positional arguments as a tuple — like C#\'s `params`.',
          '`**kwargs` collects extra keyword arguments as a dict — no direct C# equivalent.',
          'Keyword arguments: callers can pass args in any order by name.',
        ],
      },
      {
        title: 'Lambdas & First-Class Functions',
        description:
          'Python functions are objects — they can be passed, assigned, and returned. Lambdas are limited to a single expression.',
        csharp: `Func<int, int> double = x => x * 2;
Func<int, int, int> add = (x, y) => x + y;

var numbers = new List<int> { 3, 1, 4, 1, 5 };
var sorted = numbers.OrderBy(x => x).ToList();
var evens = numbers.Where(x => x % 2 == 0).ToList();`,
        python: `# lambda: single-expression anonymous function
double = lambda x: x * 2
add = lambda x, y: x + y

numbers = [3, 1, 4, 1, 5]

# sorted() with a key function
sorted_nums = sorted(numbers)
sorted_desc = sorted(numbers, key=lambda x: -x)

# Prefer comprehensions over lambda + filter/map
evens = [x for x in numbers if x % 2 == 0]

# Named function as argument — cleaner for complex logic
def is_even(n: int) -> bool:
    return n % 2 == 0

evens2 = list(filter(is_even, numbers))`,
        notes: [
          'Python `lambda` is limited to a single expression — no multi-line body.',
          'For anything beyond trivial, define a `def` function and pass it by name.',
          '`sorted(items, key=func)` replaces `.OrderBy(x => x)`. `reverse=True` for descending.',
          '`map()` and `filter()` exist but list comprehensions are more Pythonic and readable.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Where can Python functions be defined?',
        options: [
          'Only inside a class, like C# static methods',
          'Only at the top level of a file',
          'Anywhere: top-level, inside a class, or nested inside another function',
          'Only inside another function',
        ],
        correctIndex: 2,
        explanation:
          "Python functions are first-class objects and can be defined anywhere — at module scope, as class methods, or nested inside other functions (closures). Unlike C#, there is no requirement to wrap standalone functions in a class.",
      },
      {
        question: 'Which Python feature replaces C# method overloading?',
        options: [
          'The `@overload` decorator in all cases',
          'Default parameter values and `*args`/`**kwargs`',
          '`Optional` type hints',
          '`Union` type hints',
        ],
        correctIndex: 1,
        explanation:
          'Python has no method overloading. Use default parameter values for optional arguments, `*args` for variadic positional arguments, and `**kwargs` for variadic keyword arguments.',
      },
      {
        question: "What is the key limitation of Python's `lambda` compared to C# lambda expressions?",
        options: [
          'Lambdas cannot capture variables from the outer scope',
          'Lambdas can only accept one parameter',
          'Lambdas must be a single expression — no multi-line body',
          'Lambdas cannot be assigned to a variable',
        ],
        correctIndex: 2,
        explanation:
          'Python `lambda` is restricted to a single expression. For multi-statement logic, define a full `def` function and pass it by name — functions are first-class objects.',
      },
    ],
  },
  {
    id: 'error-handling',
    title: 'Error Handling',
    description: 'try/except, raising exceptions, the else clause, and the `with` statement.',
    comparisons: [
      {
        title: 'try / except / finally',
        description:
          "Python's `except` maps to C#'s `catch`. Python also has an `else` clause with no C# equivalent.",
        csharp: `try
{
    int result = int.Parse(userInput);
    Console.WriteLine($"Parsed: {result}");
}
catch (FormatException ex)
{
    Console.WriteLine($"Invalid format: {ex.Message}");
}
catch (Exception ex)
{
    Console.WriteLine($"Unexpected: {ex.Message}");
}
finally
{
    Console.WriteLine("Done.");
}`,
        python: `try:
    result = int(user_input)
    print(f"Parsed: {result}")
except ValueError as ex:
    print(f"Invalid format: {ex}")
except Exception as ex:
    print(f"Unexpected: {ex}")
else:
    # Runs only when NO exception was raised
    print("Parse succeeded.")
finally:
    print("Done.")`,
        notes: [
          '`except TypeError as ex:` replaces `catch (TypeError ex)`.',
          'The `else` block runs only when no exception was raised — no C# equivalent.',
          'Common exceptions: `ValueError` (like `FormatException`), `TypeError`, `KeyError`, `FileNotFoundError`, `IndexError`.',
          'Never use bare `except:` with no type — it also catches `SystemExit` and `KeyboardInterrupt`.',
        ],
      },
      {
        title: 'Raising & Custom Exceptions',
        description: 'Exceptions are raised with `raise` (no `new`). Custom exceptions inherit from `Exception`.',
        csharp: `// Raising
throw new ArgumentException("Must be positive", nameof(value));

// Custom exception
public class DomainException : Exception
{
    public string Code { get; }

    public DomainException(string message, string code)
        : base(message)
    {
        Code = code;
    }
}

// Re-raise preserving stack trace
throw;`,
        python: `# Raising — no "new" keyword
raise ValueError("Must be positive")

# Custom exception
class DomainException(Exception):
    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code

# Re-raise — bare "raise" preserves the original traceback
try:
    risky_operation()
except ValueError:
    raise  # equivalent of C#'s bare "throw;"

# Exception chaining (like inner exception)
except ValueError as ex:
    raise DomainException("Bad input", "ERR_001") from ex`,
        notes: [
          '`raise ValueError(...)` — no `new` keyword, just call the exception class.',
          'Bare `raise` re-raises the current exception and preserves the original traceback — equivalent to C#\'s `throw;`.',
          '`raise NewEx(...) from original` chains exceptions — both appear in the traceback, like C#\'s inner exception.',
          '`super().__init__(message)` calls the parent constructor — equivalent to `: base(message)`.',
        ],
      },
      {
        title: 'Context Managers (using → with)',
        description:
          "Python's `with` statement is the equivalent of C#'s `using` — cleanup is guaranteed even on exception.",
        csharp: `// using statement (IDisposable)
using var reader = new StreamReader("data.txt");
string content = reader.ReadToEnd();

// using block
using (var writer = new StreamWriter("out.txt"))
{
    writer.WriteLine("Hello");
}`,
        python: `# with statement — equivalent of "using"
with open("data.txt", "r") as f:
    content = f.read()
# f.close() called automatically, even on exception

# Multiple resources in one line
with open("input.txt") as inp, open("output.txt", "w") as out:
    out.write(inp.read())

# Custom context manager
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield  # code inside "with" block runs here
    print(f"Elapsed: {time.time() - start:.2f}s")

with timer():
    do_work()`,
        notes: [
          "`with open(path, mode) as f:` is the Python equivalent of `using var`. Always prefer it over manual `.close()`.",
          'File modes: `"r"` (read text), `"w"` (write text), `"a"` (append), `"rb"`/`"wb"` (binary).',
          'Any class with `__enter__` and `__exit__` methods works as a context manager — the `IDisposable` equivalent.',
          '`@contextmanager` + `yield` is a shortcut for writing simple context managers without a full class.',
        ],
      },
    ],
    quiz: [
      {
        question: 'What does the `else` clause in a Python `try/except/else` block do?',
        options: [
          'Runs only when an exception is caught',
          'Always runs, like `finally`',
          'Runs only if no exception was raised in the `try` block',
          'Is equivalent to a nested `if` statement',
        ],
        correctIndex: 2,
        explanation:
          "The `else` block runs only when the `try` block completes without raising any exception. There's no direct C# equivalent — it's useful for separating exception-handling code from code that should only run on success.",
      },
      {
        question: 'How do you re-raise the current exception in Python while preserving the original traceback?',
        options: ['`throw ex`', '`raise ex`', 'Bare `raise` with no argument', '`re_raise()`'],
        correctIndex: 2,
        explanation:
          "A bare `raise` with no argument re-raises the currently-handled exception and preserves its original traceback — equivalent to C#'s bare `throw;`. Writing `raise ex` resets the traceback to the current line.",
      },
      {
        question: "Which Python statement is equivalent to C#'s `using var f = new StreamReader(\"file.txt\");`?",
        options: [
          '`using f = open("file.txt")`',
          '`with open("file.txt") as f:`',
          '`using open("file.txt") as f:`',
          '`dispose f = open("file.txt")`',
        ],
        correctIndex: 1,
        explanation:
          "Python's `with` statement manages resource cleanup exactly like C#'s `using`. `close()` (or `__exit__`) is called automatically when the block exits, even if an exception is raised.",
      },
    ],
  },
  {
    id: 'async-await',
    title: 'Async / Await',
    description: 'asyncio vs Task, concurrent execution, and the single-threaded event loop trap.',
    comparisons: [
      {
        title: 'Basic Async / Await',
        description:
          '`async def` and `await` look identical to C#, but the runtime model is fundamentally different.',
        csharp: `public async Task<string> FetchDataAsync(string url)
{
    using var client = new HttpClient();
    return await client.GetStringAsync(url);
}

// Run at entry point
string data = await FetchDataAsync("https://api.example.com");
Console.WriteLine(data);`,
        python: `import asyncio
import httpx  # pip install httpx

async def fetch_data(url: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.text

# asyncio.run() starts the event loop — required at top level
async def main():
    data = await fetch_data("https://api.example.com")
    print(data)

asyncio.run(main())`,
        notes: [
          '`async def` creates a coroutine — equivalent to `async Task<T>` in C#.',
          "`asyncio.run(main())` starts the event loop. You can't just `await` at the top level like C# 9+.",
          'Python has no built-in async HTTP client. `httpx` and `aiohttp` are the standard choices.',
          '`async with` is the async-safe equivalent of `with` — same as `using` but for async resources.',
        ],
      },
      {
        title: 'Concurrent Tasks',
        description:
          '`asyncio.gather()` is `Task.WhenAll()`. `asyncio.create_task()` schedules a coroutine immediately.',
        csharp: `var task1 = FetchDataAsync(url1);
var task2 = FetchDataAsync(url2);

// Wait for both
string[] results = await Task.WhenAll(task1, task2);

// With timeout
var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
string result = await task.WaitAsync(cts.Token);`,
        python: `import asyncio

# Schedule coroutines to run concurrently
task1 = asyncio.create_task(fetch_data(url1))
task2 = asyncio.create_task(fetch_data(url2))

results = await asyncio.gather(task1, task2)

# Shorter — gather accepts coroutines directly
results = await asyncio.gather(
    fetch_data(url1),
    fetch_data(url2),
)

# Timeout
result = await asyncio.wait_for(fetch_data(url), timeout=5.0)`,
        notes: [
          '`asyncio.gather()` is `Task.WhenAll()` — runs coroutines concurrently and collects all results.',
          '`asyncio.create_task()` schedules a coroutine immediately (like `Task.Run` but on the same thread).',
          '`asyncio.wait_for(coro, timeout=n)` raises `asyncio.TimeoutError` if the limit is exceeded.',
          'Pass `return_exceptions=True` to `gather()` to prevent one failure from cancelling the rest.',
        ],
      },
      {
        title: 'The Single-Threaded Trap',
        description:
          "Python's asyncio is cooperative and single-threaded. Blocking calls freeze every coroutine — the biggest pitfall from C#.",
        csharp: `// C# async uses a thread pool — CPU-bound work is fine
int result = await Task.Run(() => HeavyComputation());

// Sync I/O is available and doesn't block other tasks
string data = File.ReadAllText("file.txt");`,
        python: `import asyncio, concurrent.futures

# BAD: time.sleep() blocks the thread — freezes everything
async def bad():
    import time
    time.sleep(5)  # no other coroutine runs during this

# GOOD: await asyncio.sleep() yields to the event loop
async def good():
    await asyncio.sleep(5)

# CPU-bound or blocking code: run in a thread pool
async def run_heavy():
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, heavy_computation)
    return result

# asyncio.to_thread() — cleaner shorthand (Python 3.9+)
result = await asyncio.to_thread(heavy_computation)`,
        notes: [
          "Python's asyncio is single-threaded (cooperative). C#'s `Task` can use multiple threads — a fundamental difference.",
          'Any blocking call (`time.sleep`, sync file I/O, heavy CPU loop) freezes the event loop and all other coroutines.',
          '`asyncio.to_thread()` (Python 3.9+) or `loop.run_in_executor()` offloads blocking/CPU-bound work to a thread pool.',
          'Never use `time.sleep()` in async code — always `await asyncio.sleep()`.',
        ],
      },
    ],
    quiz: [
      {
        question: 'What is the Python entry point for starting async code from synchronous code?',
        options: [
          '`async.run(main())`',
          '`Task.Run(main)`',
          '`asyncio.run(main())`',
          '`await main()`',
        ],
        correctIndex: 2,
        explanation:
          "`asyncio.run(main())` creates the event loop, runs the provided coroutine to completion, and closes the loop. It's required to bridge the sync/async boundary at the top level.",
      },
      {
        question: "What is the Python equivalent of C#'s `Task.WhenAll(task1, task2)`?",
        options: [
          '`asyncio.wait([task1, task2])`',
          '`asyncio.gather(task1, task2)`',
          '`await [task1, task2]`',
          '`asyncio.all([task1, task2])`',
        ],
        correctIndex: 1,
        explanation:
          '`asyncio.gather()` runs multiple coroutines or tasks concurrently and returns all their results as a list — exactly like `Task.WhenAll()`.',
      },
      {
        question: 'A developer uses `time.sleep(3)` inside an `async def` function. What actually happens?',
        options: [
          'It works exactly like `await asyncio.sleep(3)`',
          'It raises a RuntimeError immediately',
          'It blocks the entire event loop — no other coroutine can run during those 3 seconds',
          'It automatically converts to a non-blocking sleep',
        ],
        correctIndex: 2,
        explanation:
          "Python's asyncio is single-threaded. `time.sleep()` is a blocking call that halts the OS thread itself, freezing the event loop and preventing any other coroutine from executing. Always use `await asyncio.sleep()` inside async code.",
      },
    ],
  },
  {
    id: 'modules-tooling',
    title: 'Modules & Tooling',
    description: 'The import system, pip and virtual environments, and Python project structure.',
    comparisons: [
      {
        title: 'The Import System',
        description:
          "Python's `import` system replaces C#'s `using` directives, with a few important differences in how names are brought into scope.",
        csharp: `using System;
using System.Collections.Generic;
using System.Linq;

// Alias
using DT = System.DateTime;

// Static import (bring members into scope)
using static System.Math;
double pi = PI;`,
        python: `# Import a module — must qualify with module name
import math
import os

# Import specific names into scope (like "using static")
from datetime import datetime, timedelta

# Alias a module
import numpy as np         # np.array(...)
import pandas as pd        # pd.DataFrame(...)

# Avoid: imports everything, pollutes namespace
from math import *

# Relative imports (inside a package)
from .models import User   # same package
from ..utils import helper # parent package`,
        notes: [
          '`import math` requires `math.sqrt()`. `from math import sqrt` brings it into scope directly.',
          "Conventional aliases: `numpy as np`, `pandas as pd`, `matplotlib.pyplot as plt` — follow them, they're universal.",
          "Avoid `from module import *` — it's impossible to tell where names came from.",
          'Python resolves imports by searching `sys.path` — the equivalent of the assembly reference system.',
        ],
      },
      {
        title: 'Package Management (pip & venv)',
        description:
          "pip is Python's NuGet. Virtual environments (`venv`) are the equivalent of project-local package caches.",
        csharp: `// NuGet
dotnet add package Newtonsoft.Json

// .csproj
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />

// Restore
dotnet restore`,
        python: `# Install a package
pip install requests

# Virtual environment (project-local package cache)
python -m venv .venv
.venv\\Scripts\\activate       # Windows
source .venv/bin/activate    # Mac/Linux

# Install into the active venv
pip install requests httpx

# Freeze dependencies (like packages.lock.json)
pip freeze > requirements.txt

# Restore from requirements.txt (like dotnet restore)
pip install -r requirements.txt

# Modern alternative: uv (much faster drop-in for pip)
uv pip install requests`,
        notes: [
          "Always activate a venv before installing — without one, packages install globally and versions conflict across projects.",
          "`requirements.txt` is the low-tech dependency file. Modern projects use `pyproject.toml` instead (closer to `.csproj`).",
          'Popular modern tools: `uv` (fast pip replacement), `poetry` (lock files + publishing, like full .NET tooling).',
          'The `.venv` folder should be in `.gitignore` — equivalent to not committing `packages/`.',
        ],
      },
      {
        title: 'Project Structure',
        description:
          '`__init__.py` files and naming conventions determine how Python packages are structured and imported.',
        csharp: `MySolution/
├── MySolution.sln
├── MyApp/
│   ├── MyApp.csproj
│   ├── Program.cs
│   ├── Models/
│   └── Services/
└── MyApp.Tests/
    └── MyApp.Tests.csproj`,
        python: `my_project/
├── pyproject.toml       # project metadata + dependencies
├── requirements.txt     # pinned deps (committed)
├── .venv/               # virtual env (gitignored)
├── src/
│   └── my_app/
│       ├── __init__.py  # marks directory as a package
│       ├── main.py      # entry point
│       ├── models/
│       │   └── __init__.py
│       └── services/
│           └── __init__.py
└── tests/
    └── test_main.py     # pytest: test_*.py convention`,
        notes: [
          '`__init__.py` marks a directory as a Python package — enables `from my_app.models import User`. Can be empty.',
          '`pyproject.toml` is the modern project configuration file — replaces `setup.py` and covers what `.csproj` does.',
          'Test files follow `test_*.py` naming for pytest — the standard test runner (equivalent of xUnit/NUnit).',
          'No `.sln` equivalent — each `pyproject.toml` is a self-contained project.',
        ],
      },
    ],
    quiz: [
      {
        question: 'What does `from math import sqrt` do?',
        options: [
          'Imports the math module and aliases it as sqrt',
          'Makes `sqrt` available directly in scope without the `math.` prefix',
          'Imports everything from math',
          'Creates a reference to the math module',
        ],
        correctIndex: 1,
        explanation:
          "`from module import name` makes `name` available directly — equivalent to C#'s `using static System.Math`. You can then call `sqrt(16)` instead of `math.sqrt(16)`.",
      },
      {
        question: 'Why should you always use a virtual environment for Python projects?',
        options: [
          'It makes Python run faster',
          "It isolates project dependencies so they don't conflict across projects",
          'It enables type checking',
          "Without one, imports don't work",
        ],
        correctIndex: 1,
        explanation:
          "Without a venv, `pip install` installs packages globally — shared across every project on your machine. Conflicting version requirements between projects will break things, exactly like installing NuGet packages system-wide instead of per-project.",
      },
      {
        question: 'What is the purpose of `__init__.py`?',
        options: [
          "It's the entry point — equivalent of `Program.cs`",
          'It marks a directory as a Python package, enabling imports from it',
          'It defines global configuration for the package',
          "It's a build configuration file",
        ],
        correctIndex: 1,
        explanation:
          'An `__init__.py` file (even empty) makes Python treat the directory as a package, enabling `from my_app.models import User` style imports. Without it, Python won\'t recognize the directory as importable.',
      },
    ],
  },
  {
    id: 'decorators',
    title: 'Decorators',
    description: '@staticmethod, @classmethod, @lru_cache, and writing your own decorators.',
    comparisons: [
      {
        title: '@staticmethod and @classmethod',
        description:
          'Python uses decorators to distinguish static methods and factory methods from regular instance methods.',
        csharp: `public class MathUtils
{
    // Static method — no instance needed
    public static int Square(int x) => x * x;
}

public class Config
{
    private static int _instanceCount = 0;

    // Factory / named constructor
    public static Config Create()
    {
        _instanceCount++;
        return new Config();
    }

    public static int InstanceCount => _instanceCount;
}`,
        python: `class MathUtils:
    @staticmethod
    def square(x: int) -> int:
        return x * x

class Config:
    _instance_count = 0

    @classmethod
    def create(cls) -> "Config":
        cls._instance_count += 1
        return cls()          # cls() works even on subclasses

    @classmethod
    def instance_count(cls) -> int:
        return cls._instance_count

result = MathUtils.square(4)
cfg = Config.create()`,
        notes: [
          '`@staticmethod` — no `self` or `cls`. Equivalent to a C# `static` method.',
          '`@classmethod` takes `cls` (the class itself) as the first argument, not `self`. Useful for factory methods.',
          'Without either decorator, every method is an instance method that receives `self` automatically.',
          '`cls()` in a classmethod is better than hardcoding the class name — it works correctly on subclasses too.',
        ],
      },
      {
        title: 'Caching with @functools.lru_cache',
        description:
          '`@lru_cache` memoizes a function\'s return value keyed by its arguments — zero-boilerplate caching.',
        csharp: `// No built-in equivalent — manually manage a cache dict
private static readonly Dictionary<int, long> _cache = new();

public static long Fibonacci(int n)
{
    if (n <= 1) return n;
    if (_cache.TryGetValue(n, out long cached)) return cached;
    long result = Fibonacci(n - 1) + Fibonacci(n - 2);
    _cache[n] = result;
    return result;
}`,
        python: `from functools import lru_cache, cache

# Memoizes return values — keyed by arguments
@lru_cache(maxsize=None)
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# cache() is simpler (Python 3.9+, same as lru_cache(maxsize=None))
@cache
def expensive(n: int) -> int:
    return n ** 2

# Inspect cache statistics
fibonacci(10)
print(fibonacci.cache_info())   # hits, misses, maxsize, currsize
fibonacci.cache_clear()         # clear the cache`,
        notes: [
          '`@lru_cache` memoizes return values automatically — no manual cache dictionary needed.',
          '`maxsize=None` means unlimited entries. `@cache` (Python 3.9+) is identical shorthand.',
          'Arguments must be hashable (ints, strings, tuples — not lists or dicts).',
          '`func.cache_clear()` clears the cache; `func.cache_info()` shows hit/miss statistics.',
        ],
      },
      {
        title: 'Writing Your Own Decorator',
        description:
          'A decorator is just a function that takes a function and returns a wrapped version of it — `@decorator` is syntactic sugar.',
        csharp: `// No direct equivalent — closest is AOP via middleware,
// proxy classes, or PostSharp-style IL weaving.
// C# [Attributes] are metadata only; they don't wrap behavior.
[Authorize]
public IActionResult AdminPage() { ... }`,
        python: `import time
from functools import wraps
from typing import Callable

def timer(func: Callable) -> Callable:
    @wraps(func)  # copies __name__, __doc__ onto wrapper
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.3f}s")
        return result
    return wrapper

@timer
def slow_function(n: int) -> int:
    time.sleep(0.1)
    return n * 2

# @timer is exactly equivalent to:
# slow_function = timer(slow_function)`,
        notes: [
          'A decorator is a function that takes a function and returns a (usually wrapped) function.',
          '`@decorator` is syntactic sugar for `func = decorator(func)`.',
          'Always use `@functools.wraps(func)` on the inner wrapper — it preserves `__name__`, `__doc__`, and signature. Without it, every decorated function shows up as `wrapper` in stack traces.',
          'Decorators compose: multiple `@decorator` lines apply bottom-up (innermost first).',
        ],
      },
    ],
    quiz: [
      {
        question: 'What does `@staticmethod` remove from a method compared to a plain instance method?',
        options: [
          'The `cls` parameter only',
          'Both `self` and `cls` — the method receives no reference to the instance or class',
          'The ability to call the method on an instance',
          'The return type annotation',
        ],
        correctIndex: 1,
        explanation:
          '`@staticmethod` means the method receives neither `self` (the instance) nor `cls` (the class). It behaves exactly like a C# `static` method — it just lives in the class namespace for organizational purposes.',
      },
      {
        question: 'What is `@my_decorator` syntactic sugar for?',
        options: [
          '`my_decorator.apply(func)`',
          '`func = my_decorator(func)`',
          '`func.__decorate__(my_decorator)`',
          '`my_decorator.__wrap__(func)`',
        ],
        correctIndex: 1,
        explanation:
          '`@my_decorator` above a function definition is exactly equivalent to writing `func = my_decorator(func)` after it. The decorator receives the function object and returns whatever it wants — usually a wrapper function.',
      },
      {
        question: 'Why should you always use `@functools.wraps(func)` inside a decorator?',
        options: [
          'It makes the wrapper function run faster',
          'It copies the original function\'s metadata (name, docstring) onto the wrapper',
          'It adds memoization to the wrapped function',
          'It makes the decorator thread-safe',
        ],
        correctIndex: 1,
        explanation:
          'Without `@wraps(func)`, every decorated function appears as `wrapper` in stack traces and `help()` output — the original name and docstring are lost. `@wraps` copies `__name__`, `__doc__`, and `__wrapped__` so debugging stays sane.',
      },
    ],
  },
  {
    id: 'generators',
    title: 'Generators & yield',
    description: 'Lazy sequences with yield, generator expressions, yield from, and itertools.',
    comparisons: [
      {
        title: 'Generator Functions (yield)',
        description:
          'A function containing `yield` is a generator — equivalent to `IEnumerable<T>` with `yield return`, but lazier.',
        csharp: `public static IEnumerable<int> EvenNumbers(int max)
{
    for (int i = 0; i <= max; i += 2)
    {
        yield return i;
    }
}

foreach (int n in EvenNumbers(10))
    Console.WriteLine(n);

// Force all values into a list
var list = EvenNumbers(10).ToList();`,
        python: `def even_numbers(max_n: int):
    n = 0
    while n <= max_n:
        yield n
        n += 2

# Calling it returns a generator — nothing runs yet
gen = even_numbers(10)

for n in gen:
    print(n)

# Pull one value at a time manually
gen2 = even_numbers(10)
print(next(gen2))  # 0
print(next(gen2))  # 2

# Force all values into a list
evens = list(even_numbers(10))`,
        notes: [
          'A function containing `yield` is a generator function. Calling it returns a generator object — nothing executes until you iterate.',
          'Values are produced one at a time (lazy), equivalent to `IEnumerable<T>` with `yield return`.',
          '`next(gen)` pulls the next value manually — equivalent to `IEnumerator<T>.MoveNext()` + `.Current`.',
          'Generators are single-pass — you cannot reset or rewind them, unlike a list.',
        ],
      },
      {
        title: 'Generator Expressions',
        description:
          'Generator expressions are the lazy version of list comprehensions — same syntax but with `()` instead of `[]`.',
        csharp: `var numbers = Enumerable.Range(1, 1_000_000);

// LINQ is lazy by default
IEnumerable<int> lazy = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * 2);

// .ToList() forces evaluation — all results in memory
List<int> eager = lazy.ToList();

// Aggregate without materialising
long total = numbers.Where(n => n % 2 == 0).Sum();`,
        python: `numbers = range(1, 1_000_001)

# List comprehension — eager, all results in memory
eager = [n * 2 for n in numbers if n % 2 == 0]

# Generator expression — lazy (parens, not brackets)
lazy = (n * 2 for n in numbers if n % 2 == 0)

# Both iterate the same way
for val in lazy:
    break  # only the first value was computed

# Pass a generator directly to built-ins — no list needed
total = sum(n * 2 for n in numbers if n % 2 == 0)
maximum = max(n for n in numbers if n % 3 == 0)
found = any(n > 999_999 for n in numbers)`,
        notes: [
          'Generator expressions use `()` instead of `[]` — the filtering/transform syntax is identical.',
          'They\'re lazy: each value is computed only when requested. Equivalent to LINQ\'s deferred execution.',
          'Pass a generator directly to `sum()`, `max()`, `min()`, `any()`, `all()` — no `.ToList()` needed.',
          'For huge sequences, generator expressions use O(1) memory vs O(n) for a list comprehension.',
        ],
      },
      {
        title: 'yield from & itertools',
        description:
          '`yield from` delegates to another iterable. `itertools` provides the lazy equivalents of common LINQ operations.',
        csharp: `// Flattening nested sequences
public static IEnumerable<int> Flatten(
    IEnumerable<IEnumerable<int>> nested)
{
    foreach (var inner in nested)
        foreach (var item in inner)
            yield return item;
}

// LINQ equivalents
var first5 = items.Take(5);
var after3 = items.Skip(3);
var pairs = a.Zip(b);`,
        python: `import itertools

# yield from — delegates to another iterable
def flatten(nested):
    for inner in nested:
        yield from inner   # same as: for item in inner: yield item

data = [[1, 2], [3, 4], [5, 6]]
print(list(flatten(data)))  # [1, 2, 3, 4, 5, 6]

# itertools equivalents of common LINQ ops
first5 = list(itertools.islice(items, 5))         # .Take(5)
after3 = list(itertools.islice(items, 3, None))   # .Skip(3)
pairs = list(zip(a, b))                           # .Zip(b)
chained = list(itertools.chain(list_a, list_b))   # .Concat()

# Infinite generator + islice
def counter(start=0):
    n = start
    while True:
        yield n
        n += 1

first_ten = list(itertools.islice(counter(), 10))`,
        notes: [
          '`yield from iterable` is shorthand for `for item in iterable: yield item` and also forwards `send()`/`throw()` correctly.',
          '`itertools.islice(gen, n)` takes first n items — equivalent to `.Take(n)`. Use `islice(gen, start, stop)` for `.Skip().Take()`.',
          'Other useful itertools: `chain` (Concat), `zip_longest` (Zip with fill), `product` (Cartesian product), `groupby` (GroupBy).',
          'Built-in `zip()` stops at the shortest iterable — use `itertools.zip_longest` to match on the longer one.',
        ],
      },
    ],
    quiz: [
      {
        question: 'What does calling a generator function return?',
        options: [
          'The first yielded value',
          'A generator object — nothing executes until you iterate',
          'A list of all values',
          'A coroutine',
        ],
        correctIndex: 1,
        explanation:
          'Calling a generator function returns a generator object immediately — no code inside the function runs yet. Execution begins (and pauses at each `yield`) only when you iterate with `for`, `next()`, or `list()`.',
      },
      {
        question: 'What is the lazy equivalent of the list comprehension `[x * 2 for x in items]`?',
        options: [
          '`{x * 2 for x in items}`',
          '`lazy(x * 2 for x in items)`',
          '`(x * 2 for x in items)`',
          '`generate(x * 2 for x in items)`',
        ],
        correctIndex: 2,
        explanation:
          'Replacing `[]` with `()` turns a list comprehension into a generator expression. The syntax for filtering and transformation is identical — only the brackets change. The result is a lazy iterator rather than an in-memory list.',
      },
      {
        question: 'What does `yield from other_iterable` do inside a generator?',
        options: [
          'Returns `other_iterable` as a single yielded value',
          'Yields all items from `other_iterable` one at a time',
          'Calls `other_iterable.__next__()` exactly once',
          'Creates a nested generator inside the current one',
        ],
        correctIndex: 1,
        explanation:
          '`yield from iterable` is shorthand for iterating over `iterable` and yielding each item individually. It also correctly forwards `send()` and `throw()` calls, making it more than just a loop shortcut for advanced coroutine use.',
      },
    ],
  },
  {
    id: 'stdlib',
    title: 'Standard Library Highlights',
    description: 'pathlib, json, datetime, and collections — the modules you\'ll reach for every day.',
    comparisons: [
      {
        title: 'File Paths with pathlib',
        description:
          '`pathlib.Path` replaces `System.IO.Path`, `File`, and `Directory` with a single, chainable object.',
        csharp: `using System.IO;

// Join paths
string path = Path.Combine("data", "reports", "output.csv");

// File operations
bool exists = File.Exists(path);
string content = File.ReadAllText(path);
File.WriteAllText(path, "hello");

// Directory
Directory.CreateDirectory("data/reports");
string[] files = Directory.GetFiles("data", "*.csv");`,
        python: `from pathlib import Path

# / operator joins path segments
path = Path("data") / "reports" / "output.csv"

# File operations
exists = path.exists()
content = path.read_text(encoding="utf-8")
path.write_text("hello", encoding="utf-8")

# Directory
path.parent.mkdir(parents=True, exist_ok=True)
csv_files = list(Path("data").glob("*.csv"))
all_py = list(Path("src").rglob("*.py"))  # recursive

# Useful properties
print(path.name)      # output.csv
print(path.stem)      # output
print(path.suffix)    # .csv
print(path.parent)    # data/reports
print(path.resolve()) # absolute path`,
        notes: [
          '`/` operator joins path segments — equivalent to `Path.Combine("data", "reports", "output.csv")`.',
          '`mkdir(parents=True, exist_ok=True)` is the equivalent of `Directory.CreateDirectory` — no error if it already exists.',
          '`path.read_text()` / `path.write_text()` are convenient wrappers; use `open(path)` for streaming large files.',
          '`glob("*.csv")` searches one level; `rglob("*.py")` searches recursively (like `Directory.GetFiles` with `SearchOption.AllDirectories`).',
        ],
      },
      {
        title: 'JSON Serialization',
        description:
          'The `json` module handles serialization to/from strings and files. `loads`/`dumps` for strings, `load`/`dump` for files.',
        csharp: `using System.Text.Json;

var data = new { Name = "Alice", Age = 30 };
string json = JsonSerializer.Serialize(data);

var obj = JsonSerializer.Deserialize<MyClass>(json);

// Pretty print
var opts = new JsonSerializerOptions { WriteIndented = true };
string pretty = JsonSerializer.Serialize(data, opts);`,
        python: `import json

data = {"name": "Alice", "age": 30}

# Serialize dict → JSON string
json_str = json.dumps(data)
pretty   = json.dumps(data, indent=2, sort_keys=True)

# Deserialize JSON string → dict/list
obj = json.loads(json_str)
print(obj["name"])   # "Alice"

# Read/write JSON files directly
with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

with open("data.json") as f:
    loaded = json.load(f)`,
        notes: [
          '`json.dumps()` → string ("s" = string). `json.dump()` → file. Same pattern for `loads`/`load`.',
          'Python JSON deserializes to plain `dict`/`list` — no typed class mapping by default.',
          'For typed deserialization (like `JsonSerializer.Deserialize<MyClass>`), use `pydantic` or `dataclasses` + `dacite`.',
          '`json.dumps(data, indent=2, sort_keys=True)` — common options for readable, deterministic output.',
        ],
      },
      {
        title: 'collections: Counter, defaultdict, namedtuple',
        description:
          'The `collections` module fills gaps that would require LINQ or custom helpers in C#.',
        csharp: `// Count occurrences — requires GroupBy + ToDictionary
var counts = text.GroupBy(c => c)
    .ToDictionary(g => g.Key, g => g.Count());

// Dictionary with default value — requires TryGetValue
var wordCount = new Dictionary<string, int>();
foreach (var word in words)
{
    wordCount.TryGetValue(word, out int n);
    wordCount[word] = n + 1;
}

// Lightweight struct
record Point(double X, double Y);`,
        python: `from collections import Counter, defaultdict, namedtuple

# Counter — counts occurrences of each element
letter_counts = Counter("banana")
# Counter({'a': 3, 'n': 2, 'b': 1})
letter_counts.most_common(2)     # [('a', 3), ('n', 2)]
word_counts = Counter(words)     # works on any iterable

# defaultdict — missing keys return a default value
word_count = defaultdict(int)    # default = 0
for word in words:
    word_count[word] += 1        # no KeyError, no TryGetValue

groups = defaultdict(list)       # default = []
for item in items:
    groups[item.category].append(item)

# namedtuple — lightweight immutable struct
Point = namedtuple("Point", ["x", "y"])
p = Point(3.0, 4.0)
print(p.x, p.y)     # 3.0  4.0`,
        notes: [
          '`Counter` replaces `GroupBy(...).ToDictionary(g => g.Key, g => g.Count())` in one line.',
          '`defaultdict(int)` means missing keys return `0`; `defaultdict(list)` returns `[]` — no `TryGetValue` dance.',
          '`namedtuple` is a lightweight immutable struct. For mutable with type hints, use `@dataclass`.',
          'Other useful `collections` types: `deque` (efficient `.appendleft()`/`.popleft()`), `OrderedDict` (insertion order, though plain `dict` is ordered in Python 3.7+).',
        ],
      },
    ],
    quiz: [
      {
        question: 'How do you join path segments in Python with `pathlib` (equivalent of `Path.Combine`)?',
        options: [
          '`Path.join("data", "file.csv")`',
          '`Path("data") + "file.csv"`',
          '`Path("data") / "file.csv"`',
          '`Path.combine("data", "file.csv")`',
        ],
        correctIndex: 2,
        explanation:
          'pathlib overloads the `/` operator for path joining. `Path("data") / "reports" / "file.csv"` is the equivalent of `Path.Combine("data", "reports", "file.csv")` — readable and cross-platform.',
      },
      {
        question: 'In Python\'s `json` module, what is the difference between `json.dumps()` and `json.dump()`?',
        options: [
          '`dumps()` writes to a file; `dump()` returns a string',
          '`dumps()` returns a JSON string; `dump()` writes directly to a file object',
          'They are identical — the `s` stands for "safe"',
          '`dumps()` pretty-prints; `dump()` produces compact JSON',
        ],
        correctIndex: 1,
        explanation:
          '`json.dumps()` (with the `s`) serializes to a **s**tring. `json.dump()` serializes directly to a file-like object. The same `s`-for-string pattern applies to `json.loads()` vs `json.load()`.',
      },
      {
        question: 'What does `Counter("banana")` return?',
        options: [
          '`{"banana": 1}`',
          'A Counter mapping each character to its count: `{\'a\': 3, \'n\': 2, \'b\': 1}`',
          '`[\'b\', \'a\', \'n\', \'a\', \'n\', \'a\']`',
          '`6` (the length of the string)',
        ],
        correctIndex: 1,
        explanation:
          '`Counter` counts occurrences of each element in any iterable. For a string it counts characters, for a list it counts items. The result is a dict-like object: `Counter({\'a\': 3, \'n\': 2, \'b\': 1})`.',
      },
    ],
  },
  {
    id: 'type-hints',
    title: 'Type Hints & mypy',
    description: 'Nullable types, generics, Protocol as an interface substitute, and static analysis with mypy.',
    comparisons: [
      {
        title: 'Built-in Generics & Nullable Types',
        description:
          "Python's type hints are optional annotations for static analysis — not runtime enforcement. Modern syntax mirrors C# closely.",
        csharp: `// Nullable reference types
string? name = null;
int? count = null;

// Generic collections
List<string> names = new();
Dictionary<string, int> scores = new();

// Method signatures
public string? FindUser(int id) { ... }
public List<string> GetNames() { ... }`,
        python: `# Python 3.10+: X | None for nullable (like string?)
name: str | None = None
count: int | None = None

# Built-in generics (Python 3.9+)
names: list[str] = []
scores: dict[str, int] = {}
pair: tuple[str, int] = ("Alice", 30)

# Function signatures
def find_user(user_id: int) -> str | None: ...
def get_names() -> list[str]: ...

# Pre-3.10 (still common in codebases)
from typing import Optional, List, Dict
name: Optional[str] = None   # same as str | None
names: List[str] = []        # same as list[str]`,
        notes: [
          'Python 3.10+: `X | None` for nullable, `X | Y` for union. Older code uses `Optional[X]` and `Union[X, Y]` from `typing`.',
          'Python 3.9+: `list[str]`, `dict[str, int]`, `tuple[int, ...]` work as-is — no `typing` import needed.',
          'Type hints are NOT enforced at runtime — they are hints for static analysis tools like `mypy`.',
          '`from __future__ import annotations` enables 3.10+ syntax in Python 3.7–3.9.',
        ],
      },
      {
        title: 'Protocol — Structural Typing',
        description:
          '`Protocol` is the closest Python equivalent to a C# interface, but uses structural (duck) typing — no explicit declaration needed.',
        csharp: `// Nominal typing — must explicitly implement
public interface IDrawable
{
    void Draw();
    double Area();
}

public class Circle : IDrawable
{
    public void Draw() => Console.WriteLine("Drawing");
    public double Area() => Math.PI * _r * _r;
}

void Render(IDrawable shape) => shape.Draw();`,
        python: `from typing import Protocol

# Structural typing — no explicit declaration needed
class Drawable(Protocol):
    def draw(self) -> None: ...
    def area(self) -> float: ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")
    def area(self) -> float:
        return 3.14 * self._r ** 2

# Circle satisfies Drawable without inheriting from it
def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())  # mypy accepts this — Circle has draw() and area()`,
        notes: [
          '`Protocol` enables structural subtyping — a class satisfies the Protocol if it has the required methods, without inheriting from it.',
          'Unlike `ABC`, `Protocol` is checked statically by mypy but not enforced at runtime.',
          '`TypedDict` applies the same idea to dictionaries: `class UserDict(TypedDict): name: str; age: int`.',
          'For runtime enforcement (like `isinstance` checks), inherit from the Protocol explicitly: `class Circle(Drawable):` still works.',
        ],
      },
      {
        title: 'TypeVar, Callable, and mypy',
        description:
          '`TypeVar` is the equivalent of C# generic type parameters. `mypy` is the standard static type checker.',
        csharp: `// Generic method
public static T First<T>(IEnumerable<T> items)
    => items.First();

// Func / Action
Func<int, int, int> add = (a, b) => a + b;
Action<string> log = s => Console.WriteLine(s);`,
        python: `from typing import TypeVar, Callable

T = TypeVar("T")

# Generic function — T is inferred from the argument
def first(items: list[T]) -> T:
    return items[0]

# Callable[[ArgTypes...], ReturnType] = Func<...>
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

# Running mypy
# pip install mypy
# mypy my_module.py
# mypy src/ --strict

# Inline suppression (use sparingly)
value: str = get_value()  # type: ignore[assignment]`,
        notes: [
          '`TypeVar("T")` declares a generic type variable — equivalent to `<T>` in a C# generic method.',
          '`Callable[[ArgType1, ArgType2], ReturnType]` is `Func<ArgType1, ArgType2, ReturnType>`.',
          '`mypy` is the standard static type checker — run it in CI to catch type errors before runtime.',
          '`--strict` enables all mypy checks (requires all code to be fully annotated). Start with just `mypy src/` and add strictness incrementally.',
        ],
      },
    ],
    quiz: [
      {
        question: "What is the Python 3.10+ syntax for a nullable string (equivalent of C#'s `string?`)?",
        options: ['`Optional(str)`', '`str | None`', '`Nullable[str]`', '`str?`'],
        correctIndex: 1,
        explanation:
          'Python 3.10+ uses `X | None` for nullable types. Older code uses `Optional[X]` from the `typing` module — they mean exactly the same thing. `str?` is not valid Python syntax.',
      },
      {
        question: 'How does `Protocol` differ from `ABC` as a typing contract?',
        options: [
          'Protocol enforces implementation at runtime; ABC does not',
          'Protocol uses structural typing — a class satisfies it without inheriting from it',
          'Protocol requires an explicit `implements Protocol` declaration',
          'They are identical',
        ],
        correctIndex: 1,
        explanation:
          "`Protocol` enables structural (duck) typing — a class satisfies the contract if it has the required methods, regardless of inheritance. `ABC` requires explicit subclassing. mypy checks both statically, but only `ABC` enforces at runtime.",
      },
      {
        question: 'Do Python type hints enforce types at runtime?',
        options: [
          'Yes — Python raises TypeError if a wrong type is passed',
          'No — they are hints for static analysis tools like mypy, ignored at runtime',
          'Only for built-in types like `int` and `str`',
          'Only when `from typing import enforce` is imported',
        ],
        correctIndex: 1,
        explanation:
          'Python type hints are purely annotations — the interpreter ignores them at runtime. A function annotated `def f(x: int)` will happily accept a string. `mypy` (or `pyright`) catches these errors statically, like the C# compiler.',
      },
    ],
  },
  {
    id: 'pytest',
    title: 'Testing with pytest',
    description: 'pytest discovery, fixtures, parametrize, and mocking — the xUnit/NUnit equivalents.',
    comparisons: [
      {
        title: 'Basic Tests & Assertions',
        description:
          'pytest discovers `test_*` functions automatically. Plain `assert` replaces `Assert.Equal` and produces detailed failure messages.',
        csharp: `[Fact]
public void Add_ReturnsSum()
{
    int result = Calculator.Add(2, 3);
    Assert.Equal(5, result);
}

[Fact]
public void Divide_ByZero_Throws()
{
    Assert.Throws<DivideByZeroException>(
        () => Calculator.Divide(10, 0)
    );
}`,
        python: `# No class or attribute needed
def test_add_returns_sum():
    result = add(2, 3)
    assert result == 5

def test_divide_by_zero_raises():
    import pytest
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

# Assert on exceptions and messages
def test_value_error_message():
    with pytest.raises(ValueError, match="must be positive"):
        validate(-1)

# Run: pytest
# Verbose: pytest -v
# Single test: pytest -k "test_add"`,
        notes: [
          'pytest discovers any function named `test_*` in any file named `test_*.py` — no class, base class, or attribute needed.',
          'Plain `assert` works — pytest rewrites assertions to show the left and right values on failure.',
          '`pytest.raises(ExceptionType)` as a context manager replaces `Assert.Throws<T>`.',
          '`match="..."` on `pytest.raises` checks the exception message with a regex — like `Assert.Contains`.',
        ],
      },
      {
        title: 'Fixtures and @pytest.mark.parametrize',
        description:
          'Fixtures replace constructor injection / IDisposable setup. `parametrize` replaces `[Theory][InlineData]`.',
        csharp: `// xUnit constructor injection + IDisposable
public class DbTests : IDisposable
{
    private readonly DbConnection _conn;

    public DbTests()
    {
        _conn = new DbConnection("test_db");
    }

    public void Dispose() => _conn.Close();
}

// Theory / InlineData
[Theory]
[InlineData(2, 3, 5)]
[InlineData(-1, 1, 0)]
public void Add_ReturnsExpected(int a, int b, int expected)
{
    Assert.Equal(expected, new Calculator().Add(a, b));
}`,
        python: `import pytest

# Fixture — shared setup/teardown, injected by parameter name
@pytest.fixture
def db_connection():
    conn = create_connection("test_db")
    yield conn       # test runs here
    conn.close()     # teardown after yield

def test_query(db_connection):
    result = db_connection.query("SELECT 1")
    assert result == 1

# parametrize — replaces [Theory][InlineData]
@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add(a, b, expected):
    assert add(a, b) == expected`,
        notes: [
          'Fixtures replace xUnit constructor injection — pytest injects them by matching parameter names.',
          'The `yield` pattern handles teardown — code after `yield` runs after the test, like `Dispose()`.',
          'Fixture scope: `@pytest.fixture(scope="session")` runs once per session; `"module"` once per file; `"function"` (default) once per test.',
          '`@pytest.mark.parametrize` runs the test once per data tuple — equivalent to `[Theory][InlineData]`.',
        ],
      },
      {
        title: 'Mocking with unittest.mock',
        description:
          '`unittest.mock` is the standard mocking library. `patch` replaces a name where it is used — a common gotcha.',
        csharp: `// Moq
var mockEmail = new Mock<IEmailService>();
mockEmail
    .Setup(s => s.Send(It.IsAny<string>()))
    .Returns(true);

var sut = new NotificationService(mockEmail.Object);
sut.Notify("alice@example.com");

mockEmail.Verify(
    s => s.Send("alice@example.com"), Times.Once);`,
        python: `from unittest.mock import MagicMock, patch

# MagicMock — flexible mock (any attr/call returns another mock)
mock_email = MagicMock()
mock_email.send.return_value = True

sut = NotificationService(email_service=mock_email)
sut.notify("alice@example.com")

mock_email.send.assert_called_once_with("alice@example.com")

# patch — replaces a name in a module during the test
# Patch WHERE IT'S USED, not where it's defined
with patch("myapp.notifications.send_email") as mock_send:
    mock_send.return_value = True
    notify("alice@example.com")
    mock_send.assert_called_once()

# As a pytest fixture via decorator
@patch("myapp.notifications.send_email")
def test_notify(mock_send):
    mock_send.return_value = True
    notify("alice@example.com")
    mock_send.assert_called_once()`,
        notes: [
          '`MagicMock()` is a flexible mock — any attribute access or method call returns another mock by default.',
          '`mock.return_value = x` sets the return value; `mock.side_effect = SomeException()` makes it raise.',
          '`patch("module.path.Name")` replaces the name **where it is used** (imported), not where it is defined — the most common patching mistake.',
          '`mock.assert_called_once_with(...)` verifies the call — equivalent of Moq\'s `.Verify(..., Times.Once)`.',
        ],
      },
    ],
    quiz: [
      {
        question: 'How does pytest discover which functions to run as tests?',
        options: [
          'Tests must be in a class that inherits from `pytest.TestCase`',
          'Any function named `test_*` in a file named `test_*.py`',
          'Tests must be decorated with `@pytest.test`',
          'Test files must be registered in `pytest.ini`',
        ],
        correctIndex: 1,
        explanation:
          'pytest uses naming conventions for discovery: test files named `test_*.py` (or `*_test.py`) and functions named `test_*`. No base class, decorator, or registration is required.',
      },
      {
        question: 'What is `@pytest.fixture` most closely equivalent to in xUnit?',
        options: [
          '`[Fact]`',
          '`[Theory]`',
          'Constructor injection and `IDisposable` for setup/teardown',
          '`[ClassData]`',
        ],
        correctIndex: 2,
        explanation:
          'pytest fixtures replace xUnit constructor injection for shared setup. Using `yield` inside the fixture also handles teardown — equivalent to `IDisposable.Dispose()`. Fixtures are injected by matching parameter names.',
      },
      {
        question: 'When using `patch`, where should you patch a name?',
        options: [
          'Where the function or class is defined',
          "Where the function or class is imported and used in the code under test",
          'In the test file itself',
          'In `conftest.py`',
        ],
        correctIndex: 1,
        explanation:
          'This is the most common patching mistake. `patch("myapp.notifications.send_email")` replaces `send_email` in `myapp.notifications` — where the code under test looks it up — not in the module where `send_email` is originally defined.',
      },
    ],
  },
  {
    id: 'dataclasses',
    title: 'Dataclasses',
    description: '@dataclass auto-generates boilerplate, field() handles mutable defaults, frozen=True gives immutability.',
    comparisons: [
      {
        title: 'Basic @dataclass',
        description:
          '`@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` from annotated fields — the C# record equivalent.',
        csharp: `// C# record — auto-generated constructor, ToString, Equals
public record Person(string Name, int Age);

// Or verbose class with manual boilerplate
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
    // Plus Equals, GetHashCode, ToString...
}`,
        python: `from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

p = Person("Alice", 30)
print(p)                     # Person(name='Alice', age=30)
p == Person("Alice", 30)     # True

# Default values
@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

cfg = Config()
cfg2 = Config(port=9000)
cfg3 = Config("prod.example.com", 443)`,
        notes: [
          '`@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` — equivalent to a C# record or a class with that boilerplate written manually.',
          'Fields with defaults must come after fields without defaults (same rule as C# optional parameters).',
          '`__repr__` produces `ClassName(field=value, ...)` automatically — no `ToString()` override needed.',
          'Add `@dataclass(order=True)` to also generate `__lt__`, `__gt__` etc. for sorting.',
        ],
      },
      {
        title: 'field() and __post_init__',
        description:
          '`field()` controls default values and metadata. `__post_init__` is where validation and normalization live.',
        csharp: `public record Order(
    string Id,
    List<string> Items,
    DateTime CreatedAt)
{
    // Compact constructor for validation
    public Order
    {
        if (string.IsNullOrEmpty(Id))
            throw new ArgumentException("Id required");
        Id = Id.ToUpper();
    }
}`,
        python: `from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Order:
    id: str
    # Use field(default_factory=...) for mutable defaults
    items: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    # repr=False hides from print output
    _secret: str = field(default="", repr=False)

    def __post_init__(self):
        # Runs after __init__ — validation and normalization
        if not self.id:
            raise ValueError("id is required")
        self.id = self.id.upper()

o = Order(id="abc", items=["x", "y"])
print(o.id)   # "ABC"`,
        notes: [
          'Never use `items: list = []` as a default — that is a shared mutable object across all instances (classic Python bug). Always use `field(default_factory=list)`.',
          '`__post_init__` runs after the generated `__init__` — the right place for validation and data normalization.',
          '`field(repr=False)` hides a field from `__repr__`; `field(compare=False)` excludes it from `__eq__`.',
          '`field(init=False)` omits the field from `__init__` entirely — set it in `__post_init__` instead.',
        ],
      },
      {
        title: 'frozen=True and pydantic',
        description:
          '`frozen=True` makes a dataclass immutable like a C# record. `pydantic` adds runtime validation for web API use cases.',
        csharp: `// Immutable record — properties are init-only
public record Point(double X, double Y);

// Runtime-validated DTO (FluentValidation style)
public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }
}`,
        python: `from dataclasses import dataclass

# frozen=True — immutable, like a C# record
@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(3.0, 4.0)
# p.x = 5.0  → raises FrozenInstanceError
hash(p)  # frozen dataclasses are hashable — usable as dict keys

# Pydantic — runtime validation + type coercion (pip install pydantic)
from pydantic import BaseModel, field_validator

class CreateUserRequest(BaseModel):
    email: str
    age: int

    @field_validator("age")
    @classmethod
    def age_must_be_positive(cls, v: int) -> int:
        if v < 0:
            raise ValueError("age must be positive")
        return v

req = CreateUserRequest(email="alice@example.com", age="30")
# age "30" is coerced to int 30 automatically
print(req.age)   # 30`,
        notes: [
          '`frozen=True` makes the dataclass immutable — `__setattr__` raises `FrozenInstanceError`. Also enables `__hash__`, making instances usable as dict keys.',
          '`@dataclass` is stdlib and has zero runtime validation. `pydantic` adds validation and type coercion on instantiation.',
          'pydantic is the standard for web APIs — FastAPI uses it for request/response models automatically.',
          'pydantic `BaseModel` behaves like a dataclass but validates types at runtime, coercing compatible values (e.g., string `"30"` → int `30`).',
        ],
      },
    ],
    quiz: [
      {
        question: 'What does `@dataclass` auto-generate from the class\'s annotated fields?',
        options: [
          '`__init__` only',
          '`__init__`, `__repr__`, and `__eq__`',
          '`__init__`, `__repr__`, `__eq__`, and `__hash__`',
          'All dunder methods',
        ],
        correctIndex: 1,
        explanation:
          '`@dataclass` generates `__init__` (constructor), `__repr__` (string representation), and `__eq__` (equality comparison) by default. `__hash__` is only generated when `frozen=True` or `unsafe_hash=True` is set.',
      },
      {
        question: 'Why must you use `field(default_factory=list)` instead of `= []` as a default?',
        options: [
          '`[]` is not valid Python syntax inside a dataclass',
          '`[]` would be a single shared list object across all instances',
          '`field()` is required for all mutable types to avoid import errors',
          'It runs faster at instantiation time',
        ],
        correctIndex: 1,
        explanation:
          'Using `= []` as a default sets one list object that is shared by every instance — modifying it on one instance modifies all of them. `field(default_factory=list)` calls `list()` fresh for each new instance. This is one of the most common Python bugs.',
      },
      {
        question: 'What does `@dataclass(frozen=True)` do?',
        options: [
          'Prevents the class from being subclassed',
          'Makes all fields read-only — attempting to set them raises FrozenInstanceError',
          'Generates `__hash__` only, without other dunder methods',
          'Freezes the class definition at import time',
        ],
        correctIndex: 1,
        explanation:
          '`frozen=True` makes the dataclass immutable — `__setattr__` and `__delattr__` raise `FrozenInstanceError`. It also generates `__hash__`, making frozen instances usable as dictionary keys or in sets. This is the Python equivalent of C# records.',
      },
    ],
  },
];
