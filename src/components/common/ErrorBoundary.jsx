import React from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-red-100 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-[18px] sm:text-[20px] font-black text-slate-800 mb-2">
              មានបញ្ហាក្នុងការបង្ហាញទិន្នន័យ
            </h3>
            <p className="text-[13px] sm:text-[14px] text-slate-500 font-medium mb-6">
              សូមអភ័យទោស ប្រព័ន្ធបានជួបប្រទះបញ្ហាបច្ចេកទេសបន្តិចបន្តួច។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីព្យាយាមឡើងវិញ។
            </p>
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] sm:text-[14px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>ព្យាយាមឡើងវិញ</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
