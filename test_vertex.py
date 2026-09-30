import os
from google import genai

def test():
    client = genai.Client(vertexai=True, project="jansetu-510215", location="asia-south1")
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents='Hello, world!'
        )
        print("Success:", response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
