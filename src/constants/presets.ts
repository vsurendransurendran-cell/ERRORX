export interface CodePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  traceback?: string;
}

export const PRESETS: CodePreset[] = [
  {
    id: 'missing-colon',
    name: 'Missing Colon in "if"',
    category: 'Syntax Error',
    description: 'Header statement missing closing colon at end of condition',
    code: `def check_temperature(temp):\n    if temp > 100\n        print("Extreme heat warning!")\n    else:\n        print("Temperature normal")\n\ncheck_temperature(105)`
  },
  {
    id: 'indentation-mismatch',
    name: 'Unexpected Indentation',
    category: 'Indentation Error',
    description: 'Function body fails to align with Python 4-space block rules',
    code: `def calculate_perimeter(width, height):\nprint("Computing perimeter...")\n    return 2 * (width + height)\n\nval = calculate_perimeter(10, 20)`
  },
  {
    id: 'undefined-typo',
    name: 'Undefined Name / Typo',
    category: 'Name Resolution',
    description: 'Misspelled function name "prnt" and undefined variable "tottal"',
    code: `def summarize_order(price, tax_rate):\n    subtotal = price * (1 + tax_rate)\n    prnt(f"Order processed: {tottal}")\n    return subtotal\n\nsummarize_order(49.99, 0.08)`
  },
  {
    id: 'mutable-default',
    name: 'Mutable Default Argument',
    category: 'Runtime Trap',
    description: 'Default list parameter target=[] persists state across function invocations',
    code: `def append_event(event_name, event_log=[]):\n    event_log.append(event_name)\n    return event_log\n\n# Notice how second call includes items from the first call!\nlog1 = append_event("UserLogin")\nlog2 = append_event("FileDownloaded")\nprint(log2)`
  },
  {
    id: 'type-mismatch',
    name: 'String + Integer Concatenation',
    category: 'Type Error',
    description: 'Direct string concatenation with integer literal without conversion',
    code: `def build_user_badge(username, user_id):\n    badge_text = "Account: @" + username + " | ID: " + user_id\n    return badge_text\n\nprint(build_user_badge("alex_dev", 4082))`
  },
  {
    id: 'shadowing-builtin',
    name: 'Shadowing Built-in "list"',
    category: 'Anti-Pattern',
    description: 'Overwriting built-in list constructor prevents future list conversions',
    code: `def process_names(raw_data):\n    # Reassigning the built-in 'list' name\n    list = ["Alice", "Bob", "Charlie"]\n    \n    # Now calling list() triggers TypeError!\n    converted = list(raw_data)\n    return converted\n\nprocess_names(("David", "Elena"))`
  },
  {
    id: 'zero-division',
    name: 'Division by Zero Risk',
    category: 'Runtime Exception',
    description: 'Direct mathematical division by zero literal',
    code: `def compute_aspect_ratio(width, height):\n    ratio = width / 0\n    return ratio\n\nprint(compute_aspect_ratio(1920, 1080))`
  },
  {
    id: 'mutate-while-iterating',
    name: 'Mutating List in Loop',
    category: 'Runtime Risk',
    description: 'Calling .remove() on the collection being traversed causes items to be skipped',
    code: `def remove_negatives(numbers):\n    for num in numbers:\n        if num < 0:\n            numbers.remove(num)\n    return numbers\n\n# Due to index shifting, consecutive negatives get skipped!\nitems = [1, -2, -3, 4, -5]\nprint(remove_negatives(items))`
  },
  {
    id: 'compare-none',
    name: 'Comparing "== None"',
    category: 'Style & Robustness',
    description: 'Using equality == None instead of idiomatic identity "is None"',
    code: `def get_user_session(token):\n    session = None\n    if session == None:\n        print("Session expired or missing")\n    return session\n\nget_user_session("abc")`
  },
  {
    id: 'traceback-index-error',
    name: 'Traceback: IndexError',
    category: 'Stack Trace Parser',
    description: 'Runtime stack trace from an out-of-bounds list access',
    code: `def fetch_primary_email(emails):\n    return emails[0]\n\nprint(fetch_primary_email([]))`,
    traceback: `Traceback (most recent call last):
  File "email_service.py", line 2, in fetch_primary_email
    return emails[0]
IndexError: list index out of range`
  },
  {
    id: 'valid-clean-code',
    name: 'Valid Python Code',
    category: 'Correct Syntax',
    description: 'Clean, well-structured Python recursive Fibonacci with type hints',
    code: `def fibonacci(n: int) -> int:\n    """Compute the nth Fibonacci number safely."""\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\nprint([fibonacci(i) for i in range(10)])`
  }
];
