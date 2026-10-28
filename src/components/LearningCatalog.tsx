import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, Lightbulb, Shield, Code, ChevronRight } from 'lucide-react';

interface ConceptGuide {
  id: string;
  category: string;
  title: string;
  summary: string;
  mentalModel: string;
  badCode: string;
  goodCode: string;
  proTip: string;
}

const CONCEPTS: ConceptGuide[] = [
  {
    id: 'syntax-vs-runtime',
    category: 'Core Concepts',
    title: 'Syntax Errors vs Runtime Exceptions',
    summary: 'Understanding the crucial difference between parsing failures and runtime failures.',
    mentalModel: 'A SyntaxError happens before Python ever starts executing your code (like a grammatical spelling mistake). A runtime exception happens while the code is actively executing (like tripping over a rock).',
    badCode: `# SyntaxError (Fails before running):\ndef check(score\n    print("Grade A")`,
    goodCode: `# Valid syntax, executes smoothly:\ndef check(score):\n    print("Grade A")`,
    proTip: 'If Python throws a SyntaxError on a line, look at the line directly above it for missing colons or unclosed parentheses.'
  },
  {
    id: 'mutable-defaults',
    category: 'Advanced Pitfall',
    title: 'The Mutable Default Argument Trap',
    summary: 'Why using [] or {} as function defaults leads to mysterious shared state across calls.',
    mentalModel: 'Python evaluates default parameter expressions ONCE when the function definition statement is parsed, not every time the function is called. The list is stored in the function object itself!',
    badCode: `# Bug: Every caller shares the SAME list!\ndef add_tag(tag, tags=[]):\n    tags.append(tag)\n    return tags`,
    goodCode: `# Idiomatic solution: Use None sentinel\ndef add_tag(tag, tags=None):\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags`,
    proTip: 'Always use None as the default value for lists, dictionaries, or custom objects in function signatures.'
  },
  {
    id: 'legb-scope',
    category: 'Variable Resolution',
    title: 'Python Scoping & The LEGB Rule',
    summary: 'How Python finds identifiers in Local, Enclosing, Global, and Built-in namespaces.',
    mentalModel: 'Python looks outwards in four concentric rings: Local (inside the current function) -> Enclosing (outer enclosing functions) -> Global (module level) -> Built-in (print, len, range).',
    badCode: `# UnboundLocalError trap:\ncount = 10\ndef increment():\n    count += 1 # Python treats count as local because of assignment!\n    return count`,
    goodCode: `# Explicit global or passing as parameter:\ndef increment(count):\n    return count + 1`,
    proTip: 'Prefer passing values as function parameters and returning results rather than mutating global state.'
  },
  {
    id: 'none-identity',
    category: 'PEP 8 Style',
    title: 'Identity (is) vs Equality (==) with None',
    summary: 'Why PEP 8 mandates "if x is None:" instead of "if x == None:".',
    mentalModel: 'None is a singleton: there is only one None object in Python memory. "is" checks if two variables point to the exact same memory address (fast & immune to custom __eq__).',
    badCode: `# Flawed:\nif result == None:\n    print("No result found")`,
    goodCode: `# PEP 8 Standard:\nif result is None:\n    print("No result found")`,
    proTip: 'Use "is None" and "is not None". Use "==" for comparing values like numbers, strings, and lists.'
  },
  {
    id: 'traceback-reading',
    category: 'Debugging Skills',
    title: 'How to Read a Python Traceback',
    summary: 'Tracebacks are printed chronologically: read them from the BOTTOM up!',
    mentalModel: 'The bottom line tells you WHAT went wrong (the exception type and message). The lines above tell you WHERE it failed, ending with the exact file and line number.',
    badCode: `Traceback (most recent call last):\n  File "main.py", line 42, in process_data\n    return values[i]\nIndexError: list index out of range`,
    goodCode: `# Debugging steps:\n# 1. Read bottom: "IndexError: list index out of range"\n# 2. Look at line 42: "return values[i]"\n# 3. Check len(values) vs variable i`,
    proTip: 'Start at the bottom of the stack trace to identify the exception, then look at the last frame pointing to your own project code.'
  },
  {
    id: 'shadowing-builtins',
    category: 'Language Safety',
    title: 'Never Shadow Python Built-in Names',
    summary: 'Why naming variables "list", "dict", "str", or "id" breaks your program.',
    mentalModel: 'If you assign `list = [1, 2]`, the identifier "list" now refers to your list instance instead of Python\'s built-in `list` class. Any later call to `list(other_iterable)` fails!',
    badCode: `# Overwrites built-in:\nlist = [10, 20]\nconverted = list(some_tuple) # TypeError!`,
    goodCode: `# Descriptive variable names:\nnumbers = [10, 20]\nconverted = list(some_tuple) # Works!`,
    proTip: 'Use plural nouns like items, users, rows, or records instead of data type names.'
  }
];

export const LearningCatalog: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<ConceptGuide>(CONCEPTS[0]);

  const filtered = CONCEPTS.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.summary.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Python Debugging Knowledge Center</h2>
            <p className="text-xs text-slate-400">
              Fundamental principles, traps, and mental models for mastering Python errors
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts, errors..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Two-Column Concept Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Concepts */}
        <div className="lg:col-span-1 space-y-2">
          {filtered.map((concept) => (
            <button
              key={concept.id}
              onClick={() => setSelectedConcept(concept)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                selectedConcept.id === concept.id
                  ? 'bg-sky-600/10 border-sky-500/40 text-sky-300'
                  : 'bg-[#0d1322] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {concept.category}
                </span>
                <span className="text-xs font-semibold block text-slate-100 mt-0.5">
                  {concept.title}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                selectedConcept.id === concept.id ? 'text-sky-400 translate-x-0.5' : 'text-slate-600'
              }`} />
            </button>
          ))}
        </div>

        {/* Selected Concept Deep Dive */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {selectedConcept.category}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              {selectedConcept.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {selectedConcept.summary}
            </p>
          </div>

          {/* Mental Model Box */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-900/40 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Mental Model & Under the Hood</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {selectedConcept.mentalModel}
            </p>
          </div>

          {/* Code Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-red-900/40 bg-[#150f14] p-3.5">
              <span className="text-[11px] font-semibold text-red-400 block mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                The Common Mistake
              </span>
              <pre className="font-mono text-xs text-red-200 whitespace-pre overflow-x-auto p-2 bg-slate-950/60 rounded">
                {selectedConcept.badCode}
              </pre>
            </div>

            <div className="rounded-xl border border-emerald-900/40 bg-[#0d1814] p-3.5">
              <span className="text-[11px] font-semibold text-emerald-400 block mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                The Idiomatic Solution
              </span>
              <pre className="font-mono text-xs text-emerald-200 whitespace-pre overflow-x-auto p-2 bg-slate-950/60 rounded">
                {selectedConcept.goodCode}
              </pre>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Pro Debugging Habit:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                {selectedConcept.proTip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
