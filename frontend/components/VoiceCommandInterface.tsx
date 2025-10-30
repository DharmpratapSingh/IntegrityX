'use client'

import React, { useState, useEffect, useRef } from 'react'
import { json as fetchJson, fetchWithTimeout } from '@/utils/api'
import { Mic, MicOff, HelpCircle, X, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'

interface VoiceCommandResponse {
  success: boolean
  operation: string
  message: string
  action?: string
  parameters?: Record<string, any>
  api_endpoint?: string
  method?: string
  suggestions?: string[]
}

interface VoiceCommandInterfaceProps {
  onCommandProcessed?: (response: VoiceCommandResponse) => void
  onError?: (error: string) => void
}

export default function VoiceCommandInterface({ 
  onCommandProcessed, 
  onError 
}: VoiceCommandInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [availableCommands, setAvailableCommands] = useState<any[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [commandResult, setCommandResult] = useState<string | null>(null)
  const [resultType, setResultType] = useState<'success' | 'error' | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        setupRecognition()
      }
    }

    // Load available commands
    loadAvailableCommands()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const setupRecognition = () => {
    if (!recognitionRef.current) return

    const recognition = recognitionRef.current
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setCommandResult(null)
      setResultType(null)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (transcript.trim()) {
        processVoiceCommand(transcript.trim())
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setResultType('error')
      setCommandResult(`Speech recognition error: ${event.error}`)
      onError?.(`Speech recognition error: ${event.error}`)
    }
  }

  const loadAvailableCommands = async () => {
    try {
      const res = await fetchJson<any>('http://localhost:8000/api/voice/available-commands', { timeoutMs: 8000 })
      if (res.ok && res.data) setAvailableCommands(res.data.data.commands)
    } catch (error) {
      console.error('Failed to load available commands:', error)
    }
  }

  const processVoiceCommand = async (command: string) => {
    if (!command.trim()) return

    setIsProcessing(true)
    setLastCommand(command)
    setCommandResult(null)
    setResultType(null)

    try {
      const response = await fetchWithTimeout('http://localhost:8000/api/voice/process-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command,
          user_id: 'frontend_user'
        }),
        timeoutMs: 10000,
        retries: 1
      })

      const data = await response.json()
      
      if (data.ok) {
        const voiceResponse = data.data.voice_response as VoiceCommandResponse
        onCommandProcessed?.(voiceResponse)
        
        setResultType('success')
        setCommandResult(voiceResponse.message)
        
        // If the command was successful and has an API endpoint, execute it
        if (voiceResponse.success && voiceResponse.api_endpoint) {
          await executeCommand(voiceResponse)
        }
      } else {
        setResultType('error')
        setCommandResult(data.error?.message || 'Failed to process voice command')
        onError?.(data.error?.message || 'Failed to process voice command')
      }
    } catch (error) {
      console.error('Error processing voice command:', error)
      setResultType('error')
      setCommandResult(`Network error: ${error}`)
      onError?.(`Network error: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const executeCommand = async (voiceResponse: VoiceCommandResponse) => {
    try {
      const { api_endpoint, method, parameters } = voiceResponse
      
      if (!api_endpoint) return

      let url = api_endpoint
      if (parameters?.artifact_id && url.includes('{artifact_id}')) {
        url = url.replace('{artifact_id}', parameters.artifact_id)
      }

      const options: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }

      if (method === 'POST' && parameters) {
        options.body = JSON.stringify(parameters)
      }

      const response = await fetchWithTimeout(url, { ...options, timeoutMs: 10000, retries: 1 })
      const data = await response.json()
      
      if (data.ok) {
        console.log('Command executed successfully:', data)
        setResultType('success')
        setCommandResult('Command executed successfully!')
      } else {
        console.error('Command execution failed:', data)
        setResultType('error')
        setCommandResult(`Execution failed: ${data.error?.message || 'Unknown error'}`)
        onError?.(`Command execution failed: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error executing command:', error)
      setResultType('error')
      setCommandResult(`Execution error: ${error}`)
      onError?.(`Command execution error: ${error}`)
    }
  }

  const startListening = () => {
    if (!recognitionRef.current || isListening) return
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setResultType('error')
      setCommandResult('Failed to start voice recognition')
      onError?.('Failed to start voice recognition')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleManualCommand = () => {
    if (transcript.trim()) {
      processVoiceCommand(transcript.trim())
    }
  }

  // Group commands by category
  const groupedCommands = availableCommands.reduce((acc, cmd) => {
    let category = 'General'
    if (cmd.operation.includes('bulk') || cmd.operation.includes('compliance')) {
      category = 'Analytics'
    } else if (cmd.operation.includes('lineage') || cmd.operation.includes('version') || cmd.operation.includes('provenance') || cmd.operation.includes('creator') || cmd.operation.includes('modified')) {
      category = 'Provenance'
    } else if (cmd.operation.includes('quantum') || cmd.operation.includes('tamper') || cmd.operation.includes('security') || cmd.operation.includes('fraud')) {
      category = 'Security'
    } else if (cmd.operation.includes('attestation') || cmd.operation.includes('disclosure') || cmd.operation.includes('verify')) {
      category = 'Documents'
    } else if (cmd.operation.includes('list') || cmd.operation.includes('system')) {
      category = 'System'
    }
    
    if (!acc[category]) acc[category] = []
    acc[category].push(cmd)
    return acc
  }, {} as Record<string, any[]>)

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl">
        <div className="text-center">
          <MicOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Voice Commands Not Supported</h3>
          <p className="text-gray-600 max-w-md">
            Your browser doesn't support speech recognition. Please use a modern browser like Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Voice Commands</h3>
              <p className="text-sm text-blue-100">Control IntegrityX with your voice</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {showHelp ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-white border-b border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-6 space-y-6">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                  {category}
                </h4>
                <div className="space-y-3 ml-3">
                  {commands.map((cmd, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-gray-700 font-medium mb-1">{cmd.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {cmd.examples.slice(0, 2).map((example: string, i: number) => (
                          <code key={i} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-blue-600">
                            "{example}"
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Microphone Control */}
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`
              relative w-24 h-24 rounded-full transition-all duration-300 transform hover:scale-105
              ${isListening 
                ? 'bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/50 animate-pulse' 
                : isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 hover:shadow-xl'
              }
            `}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 text-white animate-spin mx-auto" />
            ) : isListening ? (
              <Mic className="h-10 w-10 text-white mx-auto" />
            ) : (
              <MicOff className="h-10 w-10 text-white mx-auto" />
            )}
          </button>
          
          <div className="mt-6 text-center">
            {isListening && (
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                Listening...
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
            {!isListening && !isProcessing && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Ready
              </div>
            )}
          </div>
        </div>

        {/* Transcript Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Command Transcript
          </label>
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Speak or type your command here..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <button 
              onClick={handleManualCommand}
              disabled={!transcript.trim() || isProcessing}
              className="absolute bottom-3 right-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Execute
            </button>
          </div>
        </div>

        {/* Command Result */}
        {commandResult && (
          <div className={`rounded-2xl shadow-lg p-6 ${
            resultType === 'success' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' 
              : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {resultType === 'success' ? (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                  resultType === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {resultType === 'success' ? 'Success' : 'Error'}
                </h4>
                <p className={`text-sm ${
                  resultType === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {commandResult}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Command */}
        {lastCommand && (
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <div className="h-1 w-1 rounded-full bg-gray-400"></div>
              Last Command
            </div>
            <p className="text-gray-900 font-mono text-sm">"{lastCommand}"</p>
          </div>
        )}
      </div>

      {/* Footer Hint */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <p className="text-sm text-white text-center">
          💡 <span className="font-semibold">Tip:</span> Click the <HelpCircle className="inline h-4 w-4" /> icon to see all available commands
        </p>
      </div>
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
