import { AppTourFile } from '../models/AppTourFile';

export const PYTHON_TOUR_FILES: AppTourFile[] = [
  {
    id: 'models-book',
    csharpPath: 'Models/Book.cs',
    pythonPath: 'models/book.py',
    description: 'The Book domain model — demonstrates dataclasses, type hints, and OOP.',
    lessonIds: ['dataclasses', 'type-hints', 'oop'],
    csharp: `// Models/Book.cs
using System;
using System.Collections.Generic;

namespace BooksApp.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Genre { get; set; } = string.Empty;
        public double Rating { get; set; }
        public bool IsRead { get; set; }

        public Book() { }

        public Book(int id, string title, string author,
                    int year, string genre, double rating = 0.0)
        {
            Id = id;
            Title = title;
            Author = author;
            Year = year;
            Genre = genre;
            Rating = rating;
            IsRead = false;
        }

        public void MarkAsRead(double rating)
        {
            IsRead = true;
            Rating = rating;
        }

        public override string ToString()
            => $"[{Id}] {Title} by {Author} ({Year}) - {Genre}";
    }

    // Value object for search criteria
    public record BookFilter(
        string? Genre = null,
        int? MinYear = null,
        double? MinRating = null,
        bool? IsRead = null
    );
}`,
    python: `# models/book.py
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Book:
    id: int
    title: str
    author: str
    year: int
    genre: str
    rating: float = 0.0
    is_read: bool = False

    def mark_as_read(self, rating: float) -> None:
        self.is_read = True
        self.rating = rating

    def __str__(self) -> str:
        return f"[{self.id}] {self.title} by {self.author} ({self.year}) - {self.genre}"


# Dataclass for search criteria (like C# record)
@dataclass(frozen=True)
class BookFilter:
    genre: Optional[str] = None
    min_year: Optional[int] = None
    min_rating: Optional[float] = None
    is_read: Optional[bool] = None`,
    notes: [
      '`@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` — no boilerplate constructor needed.',
      'Type hints (`str`, `int`, `float`, `Optional[str]`) mirror C# type annotations but are not enforced at runtime.',
      '`frozen=True` on `BookFilter` makes it immutable, equivalent to a C# `record` with init-only properties.',
      'Default field values (`rating: float = 0.0`) work like C# default parameter values.',
      'Python uses `snake_case` for properties; C# uses `PascalCase`.',
      'No `string.Empty` in Python: C# uses `= string.Empty` because strings are reference types that default to `null`. In Python, strings are never `null` — a `str` field with no default is simply a *required* constructor argument. If you want an optional empty default, write `title: str = ""`. The `None` equivalent only appears when you opt in with `Optional[str]`.',
    ],
  },
  {
    id: 'repository',
    csharpPath: 'Repository/BookRepository.cs',
    pythonPath: 'repository/book_repository.py',
    description: 'In-memory CRUD repository — demonstrates collections, LINQ-style queries, and error handling.',
    lessonIds: ['collections', 'error-handling'],
    csharp: `// Repository/BookRepository.cs
using System;
using System.Collections.Generic;
using System.Linq;
using BooksApp.Models;

namespace BooksApp.Repository
{
    public class BookRepository
    {
        private readonly Dictionary<int, Book> _books = new();
        private int _nextId = 1;

        public Book Add(Book book)
        {
            book.Id = _nextId++;
            _books[book.Id] = book;
            return book;
        }

        public Book GetById(int id)
        {
            if (!_books.TryGetValue(id, out var book))
                throw new KeyNotFoundException($"Book {id} not found.");
            return book;
        }

        public IEnumerable<Book> GetAll() => _books.Values;

        public IEnumerable<Book> Search(BookFilter filter)
        {
            var query = _books.Values.AsQueryable();

            if (filter.Genre != null)
                query = query.Where(b => b.Genre == filter.Genre);
            if (filter.MinYear.HasValue)
                query = query.Where(b => b.Year >= filter.MinYear.Value);
            if (filter.MinRating.HasValue)
                query = query.Where(b => b.Rating >= filter.MinRating.Value);
            if (filter.IsRead.HasValue)
                query = query.Where(b => b.IsRead == filter.IsRead.Value);

            return query.OrderBy(b => b.Title).ToList();
        }

        public Book Update(int id, Action<Book> mutate)
        {
            var book = GetById(id);
            mutate(book);
            return book;
        }

        public bool Delete(int id)
        {
            return _books.Remove(id);
        }

        public int Count => _books.Count;
    }
}`,
    python: `# repository/book_repository.py
from typing import Iterator
from models.book import Book, BookFilter

class BookNotFoundError(Exception):
    pass

class BookRepository:
    def __init__(self) -> None:
        self._books: dict[int, Book] = {}
        self._next_id: int = 1

    def add(self, book: Book) -> Book:
        book.id = self._next_id
        self._next_id += 1
        self._books[book.id] = book
        return book

    def get_by_id(self, book_id: int) -> Book:
        if book_id not in self._books:
            raise BookNotFoundError(f"Book {book_id} not found.")
        return self._books[book_id]

    def get_all(self) -> list[Book]:
        return list(self._books.values())

    def search(self, filter: BookFilter) -> list[Book]:
        results = self._books.values()

        if filter.genre is not None:
            results = (b for b in results if b.genre == filter.genre)
        if filter.min_year is not None:
            results = (b for b in results if b.year >= filter.min_year)
        if filter.min_rating is not None:
            results = (b for b in results if b.rating >= filter.min_rating)
        if filter.is_read is not None:
            results = (b for b in results if b.is_read == filter.is_read)

        return sorted(results, key=lambda b: b.title)

    def update(self, book_id: int, **kwargs) -> Book:
        book = self.get_by_id(book_id)
        for key, value in kwargs.items():
            setattr(book, key, value)
        return book

    def delete(self, book_id: int) -> bool:
        return self._books.pop(book_id, None) is not None

    @property
    def count(self) -> int:
        return len(self._books)`,
    notes: [
      'Python raises custom exceptions by subclassing `Exception` — no `throw new X()` syntax, just `raise BookNotFoundError(...)`.',
      '`dict[int, Book]` is the Python equivalent of `Dictionary<int, Book>` — built-in type, no `using` needed.',
      '`**kwargs` in `update()` lets callers pass any field by name (e.g., `update(1, title="New Title")`) — similar to C# object initializers.',
      '`@property` turns a method into a computed property, just like a C# `get`-only property.',
      'Python\'s `in` operator replaces `ContainsKey` / `TryGetValue` for dict lookups.',
    ],
  },
  {
    id: 'service',
    csharpPath: 'Services/BookService.cs',
    pythonPath: 'service/book_service.py',
    description: 'Business logic layer — demonstrates decorators, generators, and higher-order functions.',
    lessonIds: ['decorators', 'generators', 'functions'],
    contrivedNote:
      'Using @lru_cache on get_stats() and a generator for paginate() are slightly contrived here — a real app would invalidate the cache on writes and use offset/limit SQL. These are included as working demonstrations of Python features with a C# parallel.',
    csharp: `// Services/BookService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using BooksApp.Models;
using BooksApp.Repository;

namespace BooksApp.Services
{
    public class BookService
    {
        private readonly BookRepository _repo;
        // Manual memoization — C# has no built-in equivalent of @lru_cache
        private Dictionary<string, object>? _statsCache;

        public BookService(BookRepository repo)
        {
            _repo = repo;
        }

        // Higher-order function: accepts a transform delegate
        public IEnumerable<T> MapBooks<T>(Func<Book, T> transform)
            => _repo.GetAll().Select(transform);

        // Manual pagination via yield return (generator-like)
        public IEnumerable<IEnumerable<Book>> Paginate(int pageSize)
        {
            var all = _repo.GetAll().ToList();
            for (int i = 0; i < all.Count; i += pageSize)
                yield return all.Skip(i).Take(pageSize);
        }

        // Stats with manual cache invalidation
        public Dictionary<string, object> GetStats()
        {
            if (_statsCache != null)
                return _statsCache;

            var books = _repo.GetAll().ToList();
            _statsCache = new Dictionary<string, object>
            {
                ["total"] = books.Count,
                ["read"] = books.Count(b => b.IsRead),
                ["avg_rating"] = books.Where(b => b.IsRead)
                                      .Select(b => b.Rating)
                                      .DefaultIfEmpty(0)
                                      .Average(),
                ["by_genre"] = books.GroupBy(b => b.Genre)
                                    .ToDictionary(g => g.Key, g => g.Count()),
            };
            return _statsCache;
        }

        public void InvalidateCache() => _statsCache = null;

        // Function composition: filter then transform
        public IEnumerable<string> GetTitles(Func<Book, bool>? predicate = null)
        {
            var books = _repo.GetAll();
            if (predicate != null)
                books = books.Where(predicate);
            return books.OrderBy(b => b.Title).Select(b => b.Title);
        }
    }
}`,
    python: `# service/book_service.py
from functools import lru_cache
from typing import Callable, Generator, TypeVar
from models.book import Book
from repository.book_repository import BookRepository

T = TypeVar("T")

class BookService:
    def __init__(self, repo: BookRepository) -> None:
        self._repo = repo

    # Higher-order function: accepts any transform callable
    def map_books(self, transform: Callable[[Book], T]) -> list[T]:
        return [transform(b) for b in self._repo.get_all()]

    # Generator function — yields one page at a time
    def paginate(self, page_size: int) -> Generator[list[Book], None, None]:
        all_books = self._repo.get_all()
        for i in range(0, len(all_books), page_size):
            yield all_books[i : i + page_size]

    # @lru_cache caches the result automatically on first call
    @lru_cache(maxsize=1)
    def get_stats(self) -> dict:
        books = self._repo.get_all()
        read = [b for b in books if b.is_read]
        avg = sum(b.rating for b in read) / len(read) if read else 0.0
        by_genre: dict[str, int] = {}
        for b in books:
            by_genre[b.genre] = by_genre.get(b.genre, 0) + 1
        return {
            "total": len(books),
            "read": len(read),
            "avg_rating": avg,
            "by_genre": by_genre,
        }

    def invalidate_cache(self) -> None:
        self.get_stats.cache_clear()

    # Higher-order function with optional predicate
    def get_titles(self, predicate: Callable[[Book], bool] | None = None) -> list[str]:
        books = self._repo.get_all()
        if predicate:
            books = [b for b in books if predicate(b)]
        return sorted(b.title for b in books)`,
    notes: [
      '`@lru_cache` is a built-in decorator that memoizes function results — C# has no direct equivalent and requires manual cache dictionaries.',
      'A generator function uses `yield` and returns a `Generator` type; Python evaluates it lazily, only computing each page when requested.',
      '`Callable[[Book], T]` is the Python type hint for a delegate — equivalent to `Func<Book, T>` in C#.',
      '`cache_clear()` is automatically added to `@lru_cache`-decorated methods to invalidate the cache.',
      'List comprehensions (`[transform(b) for b in ...]`) replace most LINQ `Select` / `Where` chains.',
    ],
  },
  {
    id: 'routes',
    csharpPath: 'Controllers/BooksController.cs',
    pythonPath: 'api/routes.py',
    description: 'HTTP API layer — demonstrates async/await with ASP.NET Core vs. FastAPI.',
    lessonIds: ['async-await'],
    csharp: `// Controllers/BooksController.cs
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using BooksApp.Models;
using BooksApp.Services;

namespace BooksApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly BookService _service;

        public BooksController(BookService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Simulate async I/O (would be real DB call)
            var books = await Task.FromResult(_service.MapBooks(b => b));
            return Ok(books);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var book = await Task.FromResult(
                    _service.MapBooks(b => b).First(b => b.Id == id));
                return Ok(book);
            }
            catch (InvalidOperationException)
            {
                return NotFound(new { message = $"Book {id} not found." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Book book)
        {
            var created = await Task.FromResult(book);
            return CreatedAtAction(nameof(GetById),
                new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id, [FromBody] Book updated)
        {
            await Task.CompletedTask;
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await Task.CompletedTask;
            return NoContent();
        }

        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var stats = await Task.FromResult(_service.GetStats());
            return Ok(stats);
        }
    }
}`,
    python: `# api/routes.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from models.book import Book
from service.book_service import BookService
from repository.book_repository import BookRepository, BookNotFoundError

app = FastAPI(title="Books API")

# Dependency setup (simplified — real app uses FastAPI Depends())
_repo = BookRepository()
_service = BookService(_repo)


class BookRequest(BaseModel):
    title: str
    author: str
    year: int
    genre: str
    rating: float = 0.0


@app.get("/api/books")
async def get_all():
    # async def makes this a coroutine — FastAPI awaits it automatically
    return _service.map_books(lambda b: b.__dict__)


@app.get("/api/books/{book_id}")
async def get_by_id(book_id: int):
    try:
        book = _repo.get_by_id(book_id)
        return book.__dict__
    except BookNotFoundError:
        raise HTTPException(status_code=404,
                            detail=f"Book {book_id} not found.")


@app.post("/api/books", status_code=201)
async def create(request: BookRequest):
    book = Book(id=0, **request.model_dump())
    created = _repo.add(book)
    return created.__dict__


@app.put("/api/books/{book_id}")
async def update(book_id: int, request: BookRequest):
    try:
        updated = _repo.update(book_id, **request.model_dump())
        return updated.__dict__
    except BookNotFoundError:
        raise HTTPException(status_code=404,
                            detail=f"Book {book_id} not found.")


@app.delete("/api/books/{book_id}", status_code=204)
async def delete(book_id: int):
    _repo.delete(book_id)


@app.get("/api/books/stats")
async def stats():
    return _service.get_stats()`,
    notes: [
      'FastAPI uses decorator-based routing (`@app.get(...)`) — more concise than ASP.NET attribute routing (`[HttpGet]`).',
      '`async def` defines a coroutine in Python; `await` suspends it until the awaited task completes — identical mental model to C# `async Task`.',
      'FastAPI automatically validates request bodies via Pydantic models (`BaseModel`) — similar to ASP.NET\'s `[FromBody]` + model binding.',
      'Python raises `HTTPException` instead of returning `NotFound()` — FastAPI catches it and writes the HTTP response.',
      '`**request.model_dump()` unpacks the Pydantic model into keyword arguments — equivalent to C#\'s object spread/mapping.',
    ],
  },
  {
    id: 'exporter',
    csharpPath: 'Utils/BookExporter.cs',
    pythonPath: 'utils/export.py',
    description: 'File export utilities — demonstrates the Python standard library (json, pathlib, collections).',
    lessonIds: ['stdlib'],
    csharp: `// Utils/BookExporter.cs
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using BooksApp.Models;

namespace BooksApp.Utils
{
    public static class BookExporter
    {
        public static void ExportToJson(
            IEnumerable<Book> books, string filePath)
        {
            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            };
            var json = JsonSerializer.Serialize(books, options);

            // System.IO.Path and File for path/file operations
            var dir = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(dir))
                Directory.CreateDirectory(dir);

            File.WriteAllText(filePath, json);
        }

        public static Dictionary<string, int> GenreReport(
            IEnumerable<Book> books)
        {
            return books
                .GroupBy(b => b.Genre)
                .OrderByDescending(g => g.Count())
                .ToDictionary(g => g.Key, g => g.Count());
        }

        public static Dictionary<int, List<Book>> GroupByDecade(
            IEnumerable<Book> books)
        {
            return books
                .GroupBy(b => (b.Year / 10) * 10)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        public static string SummaryReport(IEnumerable<Book> books)
        {
            var list = books.ToList();
            var genreReport = GenreReport(list);
            var lines = new List<string>
            {
                $"Total books: {list.Count}",
                $"Read: {list.Count(b => b.IsRead)}",
                "Genres:",
            };
            lines.AddRange(genreReport.Select(kv =>
                $"  {kv.Key}: {kv.Value}"));
            return string.Join(Environment.NewLine, lines);
        }
    }
}`,
    python: `# utils/export.py
import json
from collections import Counter
from pathlib import Path
from models.book import Book

def export_to_json(books: list[Book], file_path: str | Path) -> None:
    path = Path(file_path)          # pathlib.Path wraps any string path
    path.parent.mkdir(parents=True, exist_ok=True)

    data = [b.__dict__ for b in books]
    path.write_text(
        json.dumps(data, indent=2, default=str),
        encoding="utf-8",
    )


def genre_report(books: list[Book]) -> dict[str, int]:
    # Counter is a dict subclass that counts occurrences
    counts = Counter(b.genre for b in books)
    return dict(counts.most_common())   # sorted by frequency


def group_by_decade(books: list[Book]) -> dict[int, list[Book]]:
    decades: dict[int, list[Book]] = {}
    for book in books:
        decade = (book.year // 10) * 10
        decades.setdefault(decade, []).append(book)
    return decades


def summary_report(books: list[Book]) -> str:
    genre_counts = genre_report(books)
    lines = [
        f"Total books: {len(books)}",
        f"Read: {sum(1 for b in books if b.is_read)}",
        "Genres:",
        *[f"  {genre}: {count}" for genre, count in genre_counts.items()],
    ]
    return "\\n".join(lines)`,
    notes: [
      '`pathlib.Path` replaces `System.IO.Path` + `Directory` + `File` — it\'s an object-oriented path API that handles platform differences.',
      '`Path.write_text()` replaces `File.WriteAllText()` — cleaner and automatically manages the file handle.',
      '`collections.Counter` replaces LINQ `GroupBy(...).Count()` for frequency counting — highly optimized for this exact pattern.',
      '`Counter.most_common()` returns items sorted by count descending — equivalent to `.OrderByDescending(g => g.Count())`.',
      '`json.dumps()` is the built-in JSON serializer — no `using System.Text.Json` or NuGet package needed.',
    ],
  },
  {
    id: 'tests',
    csharpPath: 'Tests/BookServiceTests.cs',
    pythonPath: 'tests/test_book_service.py',
    description: 'Unit tests — demonstrates pytest conventions vs. xUnit/MSTest.',
    lessonIds: ['pytest'],
    csharp: `// Tests/BookServiceTests.cs
using System.Linq;
using Xunit;
using BooksApp.Models;
using BooksApp.Repository;
using BooksApp.Services;

namespace BooksApp.Tests
{
    public class BookServiceTests
    {
        private BookRepository _repo;
        private BookService _service;

        public BookServiceTests()
        {
            // xUnit creates a new instance per test — no [SetUp]
            _repo = new BookRepository();
            _service = new BookService(_repo);
            SeedData();
        }

        private void SeedData()
        {
            _repo.Add(new Book(0, "Clean Code", "Martin", 2008,
                               "Tech", 4.5) { IsRead = true });
            _repo.Add(new Book(0, "Dune", "Herbert", 1965,
                               "Sci-Fi", 4.8) { IsRead = true });
            _repo.Add(new Book(0, "Foundation", "Asimov", 1951,
                               "Sci-Fi", 4.2));
        }

        [Fact]
        public void GetStats_ReturnsCorrectCounts()
        {
            var stats = _service.GetStats();
            Assert.Equal(3, (int)stats["total"]);
            Assert.Equal(2, (int)stats["read"]);
        }

        [Fact]
        public void GetStats_IsCached()
        {
            var first = _service.GetStats();
            var second = _service.GetStats();
            Assert.Same(first, second);  // Same object reference
        }

        [Theory]
        [InlineData("Sci-Fi", 2)]
        [InlineData("Tech", 1)]
        public void GetTitles_FiltersByPredicate(
            string genre, int expected)
        {
            var titles = _service.GetTitles(b => b.Genre == genre);
            Assert.Equal(expected, titles.Count());
        }

        [Fact]
        public void Paginate_SplitsCorrectly()
        {
            var pages = _service.Paginate(2).ToList();
            Assert.Equal(2, pages.Count());
            Assert.Equal(2, pages[0].Count());
            Assert.Equal(1, pages[1].Count());
        }
    }
}`,
    python: `# tests/test_book_service.py
import pytest
from models.book import Book
from repository.book_repository import BookRepository
from service.book_service import BookService


@pytest.fixture
def repo_with_books():
    """pytest fixture — replaces [SetUp] / constructor seeding."""
    repo = BookRepository()
    repo.add(Book(0, "Clean Code", "Martin", 2008, "Tech",
                  rating=4.5, is_read=True))
    repo.add(Book(0, "Dune", "Herbert", 1965, "Sci-Fi",
                  rating=4.8, is_read=True))
    repo.add(Book(0, "Foundation", "Asimov", 1951, "Sci-Fi"))
    return repo


@pytest.fixture
def service(repo_with_books):
    """Fixtures can depend on other fixtures — no DI container needed."""
    return BookService(repo_with_books)


def test_get_stats_returns_correct_counts(service):
    stats = service.get_stats()
    assert stats["total"] == 3
    assert stats["read"] == 2


def test_get_stats_is_cached(service):
    first = service.get_stats()
    second = service.get_stats()
    assert first is second      # Same dict object — cache hit


@pytest.mark.parametrize("genre,expected", [
    ("Sci-Fi", 2),
    ("Tech", 1),
])
def test_get_titles_filters_by_predicate(service, genre, expected):
    titles = service.get_titles(lambda b: b.genre == genre)
    assert len(titles) == expected


def test_paginate_splits_correctly(service):
    pages = list(service.paginate(2))
    assert len(pages) == 2
    assert len(pages[0]) == 2
    assert len(pages[1]) == 1`,
    notes: [
      '`@pytest.fixture` replaces `[SetUp]` / constructor initialization — fixtures are injected by name into test functions.',
      'Fixtures can depend on other fixtures (e.g., `service` takes `repo_with_books`) — pytest resolves the dependency graph automatically.',
      '`@pytest.mark.parametrize` is identical to xUnit\'s `[Theory][InlineData]` — runs the same test with multiple input sets.',
      'No test class is required in pytest — plain functions starting with `test_` are discovered automatically.',
      'Assertions use plain `assert` statements — pytest rewrites them to provide detailed failure messages, unlike `Assert.Equal`.',
    ],
  },
  {
    id: 'entrypoint',
    csharpPath: 'Program.cs',
    pythonPath: 'main.py',
    description: 'Application entry point — demonstrates module system, imports, and tooling setup.',
    lessonIds: ['modules-tooling'],
    csharp: `// Program.cs
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using BooksApp.Repository;
using BooksApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Dependency injection registration
builder.Services.AddSingleton<BookRepository>();
builder.Services.AddScoped<BookService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

// Seed some initial data
using var scope = app.Services.CreateScope();
var repo = scope.ServiceProvider.GetRequiredService<BookRepository>();
repo.Add(new BooksApp.Models.Book(
    0, "Clean Code", "Robert C. Martin", 2008, "Tech", 4.5));
repo.Add(new BooksApp.Models.Book(
    0, "Dune", "Frank Herbert", 1965, "Sci-Fi", 4.8));
repo.Add(new BooksApp.Models.Book(
    0, "The Pragmatic Programmer", "Hunt & Thomas", 1999, "Tech", 4.7));

app.Run();

// dotnet run              — run the app
// dotnet test             — run tests
// dotnet add package X    — add NuGet package
// dotnet publish          — build release artifact`,
    python: `# main.py
import uvicorn
from api.routes import app, _repo
from models.book import Book

# Seed initial data
_repo.add(Book(0, "Clean Code", "Robert C. Martin", 2008, "Tech",
               rating=4.5, is_read=True))
_repo.add(Book(0, "Dune", "Frank Herbert", 1965, "Sci-Fi",
               rating=4.8, is_read=True))
_repo.add(Book(0, "The Pragmatic Programmer", "Hunt & Thomas", 1999, "Tech",
               rating=4.7))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# --- Tooling equivalents ---
# pip install fastapi uvicorn  →  dotnet add package X
# pip install -r requirements.txt  →  dotnet restore
# python -m pytest             →  dotnet test
# uvicorn main:app --reload    →  dotnet run
# pip freeze > requirements.txt  →  (no direct equivalent; use poetry lock)

# --- pyproject.toml (Poetry) equivalent of .csproj ---
# [tool.poetry]
# name = "books-app"
# version = "0.1.0"
# [tool.poetry.dependencies]
# python = "^3.11"
# fastapi = "^0.110"
# uvicorn = {extras = ["standard"], version = "^0.29"}
# [tool.poetry.group.dev.dependencies]
# pytest = "^8.0"
# ruff = "^0.4"`,
    notes: [
      'Python has no DI container by default — dependencies are constructed manually or via a framework like FastAPI\'s `Depends()`.',
      'The `if __name__ == "__main__":` guard prevents the entry-point code from running when the file is imported as a module.',
      '`import` in Python is equivalent to C# `using` — but there\'s no project file; you install packages with `pip` into a virtual environment.',
      '`pyproject.toml` (with Poetry or Hatch) is the modern equivalent of `.csproj` for declaring dependencies and project metadata.',
      '`uvicorn` is the ASGI server that hosts the FastAPI app — equivalent to Kestrel in ASP.NET Core.',
    ],
  },
];
