"""
Test script for Ollama integration
Tests the AI provider abstraction with deepseek-r1:1.5b model
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.ai_provider import get_ai_provider, get_ai_provider_with_fallback

def test_ollama_basic():
    """Test basic generation with Ollama"""
    print("\n" + "="*60)
    print("TEST 1: Basic Generation with Ollama (deepseek-r1:1.5b)")
    print("="*60)
    
    try:
        ollama = get_ai_provider("ollama")
        print(f"✅ Provider: {ollama.get_provider_name()}")
        
        prompt = "What is a chatbot? Answer in 2 sentences."
        print(f"\n📝 Prompt: {prompt}")
        print(f"⏳ Generating response...\n")
        
        response = ollama.generate_content(prompt)
        print(f"🤖 Response:\n{response}")
        print("\n✅ Test 1 PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
        return False


def test_ollama_with_system():
    """Test generation with system instruction"""
    print("\n" + "="*60)
    print("TEST 2: Generation with System Instruction")
    print("="*60)
    
    try:
        ollama = get_ai_provider("ollama")
        
        system = "You are a helpful customer support assistant for Rhinon Tech, a customer engagement platform."
        prompt = "How can I reset my password?"
        
        print(f"\n📋 System: {system}")
        print(f"📝 Prompt: {prompt}")
        print(f"⏳ Generating response...\n")
        
        response = ollama.generate_content(prompt, system)
        print(f"🤖 Response:\n{response}")
        print("\n✅ Test 2 PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
        return False


def test_streaming():
    """Test streaming responses"""
    print("\n" + "="*60)
    print("TEST 3: Streaming Response")
    print("="*60)
    
    try:
        ollama = get_ai_provider("ollama")
        
        prompt = "Tell me a very short story about a robot learning to help customers (max 3 sentences)."
        print(f"\n📝 Prompt: {prompt}")
        print(f"⏳ Streaming response...\n")
        print("🤖 Response: ", end="", flush=True)
        
        for chunk in ollama.stream_generate(prompt):
            print(chunk, end="", flush=True)
        
        print("\n\n✅ Test 3 PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test 3 FAILED: {e}")
        return False


def test_provider_switch():
    """Test switching between providers"""
    print("\n" + "="*60)
    print("TEST 4: Provider Switching")
    print("="*60)
    
    try:
        # Test Ollama
        ollama = get_ai_provider("ollama")
        print(f"✅ Ollama Provider: {ollama.get_provider_name()}")
        
        # Test OpenAI (if key available)
        try:
            openai = get_ai_provider("openai")
            print(f"✅ OpenAI Provider: {openai.get_provider_name()}")
        except Exception as e:
            print(f"⚠️  OpenAI Provider: Not configured (expected if no API key)")
        
        # Test Gemini (if key available)
        try:
            gemini = get_ai_provider("gemini")
            print(f"✅ Gemini Provider: {gemini.get_provider_name()}")
        except Exception as e:
            print(f"⚠️  Gemini Provider: Not configured (expected if no API key)")
        
        print("\n✅ Test 4 PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test 4 FAILED: {e}")
        return False


def test_fallback():
    """Test automatic fallback mechanism"""
    print("\n" + "="*60)
    print("TEST 5: Automatic Fallback")
    print("="*60)
    
    try:
        provider = get_ai_provider_with_fallback("ollama")
        print(f"✅ Provider selected: {provider.get_provider_name()}")
        
        prompt = "Say 'Hello from AI!'"
        response = provider.generate_content(prompt)
        print(f"🤖 Response: {response}")
        
        print("\n✅ Test 5 PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Test 5 FAILED: {e}")
        return False


if __name__ == "__main__":
    print("\n" + "🚀"*30)
    print("OLLAMA INTEGRATION TEST SUITE")
    print("🚀"*30)
    
    print(f"\n📊 Environment:")
    print(f"   AI_PROVIDER: {os.getenv('AI_PROVIDER', 'not set')}")
    print(f"   OLLAMA_MODEL: {os.getenv('OLLAMA_MODEL', 'not set')}")
    print(f"   OLLAMA_BASE_URL: {os.getenv('OLLAMA_BASE_URL', 'not set')}")
    
    results = []
    
    # Run tests
    results.append(("Basic Generation", test_ollama_basic()))
    results.append(("System Instruction", test_ollama_with_system()))
    results.append(("Streaming", test_streaming()))
    results.append(("Provider Switching", test_provider_switch()))
    results.append(("Fallback Mechanism", test_fallback()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Ollama integration is working!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check errors above.")
    
    print("\n" + "="*60)
