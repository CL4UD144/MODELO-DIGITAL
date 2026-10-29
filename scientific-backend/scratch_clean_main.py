path = 'scientific-backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep lines 1 to 376 (index 0 to 376)
cleaned_lines = lines[:376]
cleaned_lines.append('\n\nif __name__ == "__main__":\n')
cleaned_lines.append('    import uvicorn\n')
cleaned_lines.append('    uvicorn.run(app, host="0.0.0.0", port=8000)\n')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(cleaned_lines)

print("Successfully cleaned main.py. Total lines now:", len(cleaned_lines))
