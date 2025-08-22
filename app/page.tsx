"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Trash2, Plus, AlertTriangle, AlertCircle, ChevronUp, ChevronDown, Calculator, Calendar, Info, HelpCircle } from "lucide-react"

interface OtherFee {
  id: string
  name: string
  amount: number
}

export default function PawnshopCalculator() {
  const [loanAmount, setLoanAmount] = useState<string>("")
  const [monthlyPayment, setMonthlyPayment] = useState<string>("") // 每月繳款金額
  const [totalRepaymentAmount, setTotalRepaymentAmount] = useState<string>("") // 累積清償總額
  const [storageRate, setStorageRate] = useState<string>("")
  const [loanYear, setLoanYear] = useState<number>(0)
  const [loanMonth, setLoanMonth] = useState<number>(0)
  const [loanDay, setLoanDay] = useState<number>(0)
  const [maturityYear, setMaturityYear] = useState<number>(0)
  const [maturityMonth, setMaturityMonth] = useState<number>(0)
  const [maturityDay, setMaturityDay] = useState<number>(0)
  const [loanPeriod, setLoanPeriod] = useState<number>(0)
  const [repaymentMethod, setRepaymentMethod] = useState<string>("lump-sum")
  const [otherFees, setOtherFees] = useState<OtherFee[]>([])
  const [inputMonthlyRate, setInputMonthlyRate] = useState<string>("") // 手動輸入的月利率
  const [inputMode, setInputMode] = useState<"amount" | "rate">("amount") // 輸入模式：金額或利率

  // 數字輸入處理函數
  const handleNumberInput = (value: string, setter: (value: string) => void, allowDecimal = false) => {
    // 允許空字串
    if (value === "") {
      setter("")
      return
    }
    
    // 移除非數字字符，但保留小數點（如果允許）
    const cleanValue = allowDecimal ? 
      value.replace(/[^\d.]/g, '').replace(/(\..*?)\./g, '$1') : 
      value.replace(/[^\d]/g, '')
    
    // 如果是空字串或只有小數點，設為空
    if (cleanValue === "" || cleanValue === ".") {
      setter("")
      return
    }
    
    setter(cleanValue)
  }

  // 安全的數字轉換函數
  const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // 日期輸入處理函數
  const handleDateInput = (value: string, setter: (value: number) => void, type: "year" | "month" | "day") => {
    // 移除非數字字符
    const cleanValue = value.replace(/[^\d]/g, '')
    
    if (cleanValue === "") {
      setter(0)
      return
    }

    let numValue = parseInt(cleanValue)
    
    // 根據類型設定限制
    switch (type) {
      case "year":
        // 年份：限制在合理範圍內
        if (cleanValue.length <= 4) {
          numValue = Math.max(1900, Math.min(2100, numValue))
          setter(numValue)
        }
        break
      case "month":
        // 月份：1-12
        numValue = Math.max(1, Math.min(12, numValue))
        setter(numValue)
        break
      case "day":
        // 日期：1-31
        numValue = Math.max(1, Math.min(31, numValue))
        setter(numValue)
        break
    }
  }

  // 格式化日期顯示
  const formatDateValue = (value: number, type: "year" | "month" | "day"): string => {
    if (value === 0) return ""
    
    switch (type) {
      case "year":
        return value.toString().padStart(4, "0")
      case "month":
      case "day":
        return value.toString().padStart(2, "0")
      default:
        return value.toString()
    }
  }

  // 從月利率計算總還款金額
  const calculateTotalFromRate = (monthlyRatePercent: number) => {
    const amount = safeParseFloat(loanAmount)
    if (amount <= 0 || loanPeriod <= 0) return amount

    const monthlyRate = monthlyRatePercent / 100
    let totalInterest = 0

    switch (repaymentMethod) {
      case "lump-sum":
      case "flexible":
        totalInterest = amount * monthlyRate * loanPeriod
        break
      case "interest-only":
        totalInterest = amount * monthlyRate * loanPeriod
        break
      case "amortizing":
        // 本利攤還：使用PMT公式計算每月付款，再計算總還款
        if (monthlyRate > 0) {
          const monthlyPayment = (amount * (monthlyRate * Math.pow(1 + monthlyRate, loanPeriod))) / 
                                (Math.pow(1 + monthlyRate, loanPeriod) - 1)
          return Math.round(monthlyPayment * loanPeriod)
        } else {
          return amount
        }
      default:
        totalInterest = amount * monthlyRate * loanPeriod
    }

    return Math.round(amount + totalInterest)
  }

  // 當還款方式或輸入模式改變時，更新相關欄位
  useEffect(() => {
    if (inputMode === "rate" && inputMonthlyRate && loanAmount) {
      const rate = safeParseFloat(inputMonthlyRate)
      const calculatedTotal = calculateTotalFromRate(rate)
      setTotalRepaymentAmount(calculatedTotal.toString())
    }
    // 移除自動設定預設值的邏輯，讓使用者手動輸入
  }, [inputMode, inputMonthlyRate, loanAmount, loanPeriod])

  // 自動計算借款期間（當日期改變時）
  useEffect(() => {
    if (loanYear && loanMonth && loanDay && maturityYear && maturityMonth && maturityDay) {
      const startDate = new Date(loanYear, loanMonth - 1, loanDay)
      const endDate = new Date(maturityYear, maturityMonth - 1, maturityDay)

      if (endDate > startDate) {
        const yearDiff = endDate.getFullYear() - startDate.getFullYear()
        const monthDiff = endDate.getMonth() - startDate.getMonth()
        const dayDiff = endDate.getDate() - startDate.getDate()

        let totalMonths = yearDiff * 12 + monthDiff
        if (dayDiff < 0) {
          totalMonths -= 1
        }

        const calculatedPeriod = Math.max(1, totalMonths) // 最短1個月，支援短期借款
        setLoanPeriod(calculatedPeriod)
      }
    }
  }, [loanYear, loanMonth, loanDay, maturityYear, maturityMonth, maturityDay])

  const addOtherFee = () => {
    const newFee: OtherFee = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setOtherFees([...otherFees, newFee])
  }

  const removeOtherFee = (id: string) => {
    setOtherFees(otherFees.filter((fee) => fee.id !== id))
  }

  const updateOtherFee = (id: string, field: "name" | "amount", value: string | number) => {
    setOtherFees(otherFees.map((fee) => (fee.id === id ? { ...fee, [field]: value } : fee)))
  }

  // 調整每月繳款金額的函數
  const adjustMonthlyPayment = (increment: boolean) => {
    const step = 100
    const currentValue = safeParseFloat(monthlyPayment)
    const newPayment = increment ? currentValue + step : currentValue - step
    setMonthlyPayment(Math.max(0, newPayment).toString())
  }

  // 調整總還款金額的函數
  const adjustTotalRepayment = (increment: boolean) => {
    const step = 1
    const currentValue = safeParseFloat(totalRepaymentAmount)
    const loanAmountNum = safeParseFloat(loanAmount)
    const newTotal = increment ? currentValue + step : currentValue - step
    setTotalRepaymentAmount(Math.max(loanAmountNum, newTotal).toString())
  }

  // 調整倉棧費率的函數
  const adjustStorageRate = (increment: boolean) => {
    const step = 0.1
    const currentValue = safeParseFloat(storageRate)
    const newRate = increment ? currentValue + step : currentValue - step
    setStorageRate(Math.max(0, Math.round(newRate * 10) / 10).toString())
  }

  // 計算借款期間的函數（從借款日到今天）
  const calculateLoanPeriodToToday = () => {
    // 如果借款日期未完整輸入，設定為今天
    if (!loanYear || !loanMonth || !loanDay) {
      const today = new Date()
      setLoanYear(today.getFullYear())
      setLoanMonth(today.getMonth() + 1)
      setLoanDay(today.getDate())
      setLoanPeriod(1)
      return
    }

    const startDate = new Date(loanYear, loanMonth - 1, loanDay)
    const currentDate = new Date()

    const yearDiff = currentDate.getFullYear() - startDate.getFullYear()
    const monthDiff = currentDate.getMonth() - startDate.getMonth()
    const dayDiff = currentDate.getDate() - startDate.getDate()

    let totalMonths = yearDiff * 12 + monthDiff
    if (dayDiff < 0) {
      totalMonths -= 1
    }

    setLoanPeriod(Math.max(1, totalMonths))

    // 同時更新滿當日期為今天
    setMaturityYear(currentDate.getFullYear())
    setMaturityMonth(currentDate.getMonth() + 1)
    setMaturityDay(currentDate.getDate())
  }

  // 設定滿當日期為3個月後
  const setMaturityToThreeMonths = () => {
    // 如果借款日期未完整輸入，先設定為今天
    if (!loanYear || !loanMonth || !loanDay) {
      const today = new Date()
      setLoanYear(today.getFullYear())
      setLoanMonth(today.getMonth() + 1)
      setLoanDay(today.getDate())
      
      // 設定滿當日期為3個月後
      const maturityDate = new Date(today)
      maturityDate.setMonth(maturityDate.getMonth() + 3)
      setMaturityYear(maturityDate.getFullYear())
      setMaturityMonth(maturityDate.getMonth() + 1)
      setMaturityDay(maturityDate.getDate())
      setLoanPeriod(3)
      return
    }

    const startDate = new Date(loanYear, loanMonth - 1, loanDay)
    const maturityDate = new Date(startDate)
    maturityDate.setMonth(maturityDate.getMonth() + 3)

    setMaturityYear(maturityDate.getFullYear())
    setMaturityMonth(maturityDate.getMonth() + 1)
    setMaturityDay(maturityDate.getDate())
  }

  // 檢查滿當期限是否符合法規
  const checkMaturityPeriod = () => {
    if (!maturityYear || !maturityMonth || !maturityDay) {
      return null
    }

    const startDate = new Date(loanYear, loanMonth - 1, loanDay)
    const maturityDate = new Date(maturityYear, maturityMonth - 1, maturityDay)

    const diffTime = maturityDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = diffDays / 30.44 // 平均每月天數

    if (diffMonths < 3) {
      return "法規建議：滿當期限建議至少3個月（支援短期借款試算）"
    }
    return null
  }

  // 計算基本費用（即時計算）
  const loanAmountNum = safeParseFloat(loanAmount)
  const storageRateNum = safeParseFloat(storageRate)
  const storageFee = loanAmountNum * (storageRateNum / 100)
  const totalOtherFees = otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
  const actualReceived = loanAmountNum - storageFee - totalOtherFees

  // 根據還款方式計算總利息（即時計算）
  const calculateTotalInterest = () => {
    if (loanAmountNum <= 0 || loanPeriod <= 0) return 0

    const monthlyPaymentNum = safeParseFloat(monthlyPayment)
    const totalRepaymentNum = safeParseFloat(totalRepaymentAmount)

    switch (repaymentMethod) {
      case "lump-sum": // 一次清償
        // 總利息 = 總還款金額 - 借款金額
        return totalRepaymentNum - loanAmountNum

      case "interest-only": // 只還利息
        // 總利息 = 每月利息 × 借款期間
        return monthlyPaymentNum * loanPeriod

      case "flexible": // 彈性還款
        // 總利息 = 總還款金額 - 借款金額
        return totalRepaymentNum - loanAmountNum

      case "amortizing": // 本利攤還
        // 總利息 = (每月繳款 × 期間) - 借款金額
        return monthlyPaymentNum * loanPeriod - loanAmountNum

      default:
        return 0
    }
  }

  // 從總利息反推月利率（即時計算）
  const calculateMonthlyRate = () => {
    // 如果是利率輸入模式，直接使用輸入的利率
    if (inputMode === "rate" && inputMonthlyRate) {
      return safeParseFloat(inputMonthlyRate)
    }

    const totalInterest = calculateTotalInterest()

    if (loanAmountNum <= 0 || loanPeriod <= 0 || totalInterest <= 0) return 0

    const monthlyPaymentNum = safeParseFloat(monthlyPayment)

    switch (repaymentMethod) {
      case "lump-sum": // 一次清償
      case "flexible": // 彈性還款
        // 月利率 = 總利息 ÷ (借款金額) × 100%
        return (totalInterest / (loanAmountNum * loanPeriod)) * 100

      case "interest-only": // 只還利息
        // 月利率 = 每月利息 ÷ 借款金額 × 100%
        return (monthlyPaymentNum / loanAmountNum) * 100

      case "amortizing": // 本利攤還
        // 使用數值方法求解月利率
        return calculateAmortizingMonthlyRate()

      default:
        return 0
    }
  }

  // 本利攤還的月利率計算（數值方法）
  const calculateAmortizingMonthlyRate = () => {
    let rate = 0.01 // 初始猜測值 1%
    const tolerance = 0.0001
    const maxIterations = 1000
    const monthlyPaymentNum = safeParseFloat(monthlyPayment)

    for (let i = 0; i < maxIterations; i++) {
      const calculatedPayment =
        (loanAmountNum * (rate * Math.pow(1 + rate, loanPeriod))) / (Math.pow(1 + rate, loanPeriod) - 1)

      if (Math.abs(calculatedPayment - monthlyPaymentNum) < tolerance) {
        return rate * 100 // 轉換為百分比
      }

      // 調整利率
      if (calculatedPayment > monthlyPaymentNum) {
        rate *= 0.99
      } else {
        rate *= 1.01
      }

      // 防止負利率或過高利率
      rate = Math.max(0.0001, Math.min(rate, 0.1))
    }

    return rate * 100
  }

  const totalInterest = calculateTotalInterest()
  const monthlyRate = calculateMonthlyRate()
  const totalExpense = totalInterest + storageFee + totalOtherFees
  const totalRepayment = loanAmountNum + totalExpense

  // APR計算（即時計算）
  const totalCost = totalInterest + storageFee + totalOtherFees
  const loanYears = loanPeriod / 12
  const averageAnnualCost = loanYears > 0 ? totalCost / loanYears : 0
  const apr = actualReceived > 0 ? (averageAnnualCost / actualReceived) * 100 : 0

  // 獲取利息計算歷程
  const getInterestCalculation = () => {
    const formatNum = (num: number) => new Intl.NumberFormat("zh-TW").format(Math.round(num))
    const formatPercent = (num: number) => num.toFixed(2)

    switch (repaymentMethod) {
      case "lump-sum":
        return [
          `1. 還款方式：一次清償`,
          `2. 總還款金額 = ${formatNum(safeParseFloat(totalRepaymentAmount))}`,
          `3. 借款金額 = ${formatNum(loanAmountNum)}`,
          `4. 總利息 = ${formatNum(safeParseFloat(totalRepaymentAmount))} - ${formatNum(loanAmountNum)} = ${formatNum(totalInterest)}`,
          `5. 月利率 = ${formatNum(totalInterest)} ÷ (${formatNum(loanAmountNum)} × ${loanPeriod}) × 100% = ${formatPercent(monthlyRate)}%`,
        ]
      case "interest-only":
        return [
          `1. 還款方式：只還利息`,
          `2. 每月利息 = ${formatNum(safeParseFloat(monthlyPayment))}`,
          `3. 借款期間 = ${loanPeriod} 個月`,
          `4. 總利息 = ${formatNum(safeParseFloat(monthlyPayment))} × ${loanPeriod} = ${formatNum(totalInterest)}`,
          `5. 月利率 = ${formatNum(safeParseFloat(monthlyPayment))} ÷ ${formatNum(loanAmountNum)} × 100% = ${formatPercent(monthlyRate)}%`,
        ]
      case "flexible":
        return [
          `1. 還款方式：彈性還款`,
          `2. 累積清償總額 = ${formatNum(safeParseFloat(totalRepaymentAmount))}`,
          `3. 借款金額 = ${formatNum(loanAmountNum)}`,
          `4. 總利息 = ${formatNum(safeParseFloat(totalRepaymentAmount))} - ${formatNum(loanAmountNum)} = ${formatNum(totalInterest)}`,
          `5. 月利率 = ${formatNum(totalInterest)} ÷ (${formatNum(loanAmountNum)} × ${loanPeriod}) × 100% = ${formatPercent(monthlyRate)}%`,
        ]
      case "amortizing":
        return [
          `1. 還款方式：本利攤還`,
          `2. 每月繳款 = ${formatNum(safeParseFloat(monthlyPayment))}`,
          `3. 借款期間 = ${loanPeriod} 個月`,
          `4. 總還款 = ${formatNum(safeParseFloat(monthlyPayment))} × ${loanPeriod} = ${formatNum(safeParseFloat(monthlyPayment) * loanPeriod)}`,
          `5. 總利息 = ${formatNum(safeParseFloat(monthlyPayment) * loanPeriod)} - ${formatNum(loanAmountNum)} = ${formatNum(totalInterest)}`,
          `6. 使用數值方法計算月利率 = ${formatPercent(monthlyRate)}%`,
        ]
      default:
        return []
    }
  }

  // 獲取APR計算歷程
  const getAPRCalculation = () => {
    const formatNum = (num: number) => new Intl.NumberFormat("zh-TW").format(Math.round(num))
    const formatPercent = (num: number) => num.toFixed(2)

    return [
      `1. 總成本 = 總利息 + 倉棧費 + 其他費用`,
      `2. 總成本 = ${formatNum(totalInterest)} + ${formatNum(storageFee)} + ${formatNum(totalOtherFees)} = ${formatNum(totalCost)}`,
      `3. 實拿金額 = ${formatNum(loanAmountNum)} - ${formatNum(storageFee)} - ${formatNum(totalOtherFees)} = ${formatNum(actualReceived)}`,
      `4. 借款年期 = ${loanPeriod} ÷ 12 = ${formatPercent(loanYears)} 年`,
      `5. 平均年成本 = ${formatNum(totalCost)} ÷ ${formatPercent(loanYears)} = ${formatNum(averageAnnualCost)}`,
      `6. APR = (${formatNum(averageAnnualCost)} ÷ ${formatNum(actualReceived)}) × 100% = ${formatPercent(apr)}%`,
    ]
  }

  // 修改 formatNumber 函數
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("zh-TW").format(Math.floor(num))
  }

  // 添加專門用於累積清償總額的格式化函數
  const formatIntegerCurrency = (num: number) => {
    return `NT$ ${new Intl.NumberFormat("zh-TW").format(Math.floor(num))}`
  }

  const formatCurrency = (num: number) => {
    return `NT$ ${formatNumber(num)}`
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`
  }

  const maturityWarning = checkMaturityPeriod()

  // 根據還款方式決定顯示哪個輸入欄位
  const showMonthlyPayment = (repaymentMethod === "interest-only" || repaymentMethod === "amortizing") && inputMode === "amount"
  const showTotalRepayment = (repaymentMethod === "lump-sum" || repaymentMethod === "flexible") && inputMode === "amount"
  const showMonthlyRateInput = inputMode === "rate"

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">當鋪利息試算器</h1>
          <p className="text-gray-600">根據還款方式計算月利率與APR年百分率</p>
        </div>

        <div className="space-y-6">
          {/* 輸入區域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：基本資訊 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="loanAmount">借款金額 (NT$)</Label>
                  <Input
                    id="loanAmount"
                    type="text"
                    value={loanAmount}
                    onChange={(e) => handleNumberInput(e.target.value, setLoanAmount)}
                    className="text-lg"
                    placeholder="請輸入借款金額"
                  />
                </div>

                {/* 輸入模式選擇 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label>輸入方式</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs space-y-2">
                          <p><strong>金額輸入：</strong>輸入還款金額，系統自動計算月利率</p>
                          <p><strong>利率輸入：</strong>輸入月利率，系統自動計算還款金額</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={inputMode === "amount" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMode("amount")}
                      className="flex-1"
                    >
                      金額輸入
                    </Button>
                    <Button
                      variant={inputMode === "rate" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMode("rate")}
                      className="flex-1"
                    >
                      利率輸入
                    </Button>
                  </div>
                </div>

                {/* 根據輸入模式顯示月利率輸入欄位 */}
                {showMonthlyRateInput && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="inputMonthlyRate">月利率 (%)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-blue-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs space-y-2">
                            <p>輸入月利率後，系統會自動計算對應的還款金額。</p>
                            <p className="text-red-600 font-semibold">⚠️ 法定上限為2.5%</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="inputMonthlyRate"
                      type="text"
                      value={inputMonthlyRate}
                      onChange={(e) => handleNumberInput(e.target.value, setInputMonthlyRate, true)}
                      className="text-lg"
                      placeholder="輸入月利率"
                    />
                    {safeParseFloat(inputMonthlyRate) > 2.5 && (
                      <Alert className="mt-2 border-red-400 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 font-semibold">
                          輸入的月利率 {safeParseFloat(inputMonthlyRate).toFixed(2)}% 超過法定上限2.5%
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* 根據還款方式顯示不同的輸入欄位 */}
                {showMonthlyPayment && (
                  <div>
                    <Label htmlFor="monthlyPayment">每月繳款金額 (NT$)</Label>
                    <div className="flex">
                      <Input
                        id="monthlyPayment"
                        type="text"
                        value={monthlyPayment}
                        onChange={(e) => handleNumberInput(e.target.value, setMonthlyPayment)}
                        className="rounded-r-none"
                        placeholder="每月繳款金額"
                      />
                      <div className="flex flex-col border border-l-0 rounded-r-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 rounded-none rounded-tr-md"
                          onClick={() => adjustMonthlyPayment(true)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 rounded-none rounded-br-md"
                          onClick={() => adjustMonthlyPayment(false)}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {showTotalRepayment && (
                  <div>
                    <Label htmlFor="totalRepaymentAmount">累積清償總額 (NT$)</Label>
                    <div className="flex">
                      <Input
                        id="totalRepaymentAmount"
                        type="text"
                        value={totalRepaymentAmount}
                        onChange={(e) => handleNumberInput(e.target.value, setTotalRepaymentAmount)}
                        className="rounded-r-none"
                        placeholder="累積清償總額"
                      />
                      <div className="flex flex-col border border-l-0 rounded-r-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 rounded-none rounded-tr-md"
                          onClick={() => adjustTotalRepayment(true)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 rounded-none rounded-br-md"
                          onClick={() => adjustTotalRepayment(false)}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="storageRate">倉棧費率 (%)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">倉棧費是典當物保管費用，由當鋪收取用於保管典當品。法定上限為收當金額的5%，通常在放款時一次性扣除。</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex">
                    <Input
                      id="storageRate"
                      type="text"
                      value={storageRate}
                      onChange={(e) => handleNumberInput(e.target.value, setStorageRate, true)}
                      className="rounded-r-none"
                      placeholder="倉棧費率"
                    />
                    <div className="flex flex-col border border-l-0 rounded-r-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 rounded-none rounded-tr-md"
                        onClick={() => adjustStorageRate(true)}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 rounded-none rounded-br-md"
                        onClick={() => adjustStorageRate(false)}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {safeParseFloat(storageRate) > 5 && (
                    <Alert className="mt-2 border-red-500 bg-red-50 border-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="text-red-800 font-bold">
                        ⚠️ 違法警告：倉棧費率 <span className="text-xl font-black text-red-900">{safeParseFloat(storageRate).toFixed(1)}%</span> 超過法定上限5%
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <Label>借款日期</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      type="text"
                      placeholder="YYYY"
                      value={formatDateValue(loanYear, "year")}
                      onChange={(e) => handleDateInput(e.target.value, setLoanYear, "year")}
                      maxLength={4}
                    />
                    <Input
                      type="text"
                      placeholder="MM"
                      value={formatDateValue(loanMonth, "month")}
                      onChange={(e) => handleDateInput(e.target.value, setLoanMonth, "month")}
                      maxLength={2}
                    />
                    <Input
                      type="text"
                      placeholder="DD"
                      value={formatDateValue(loanDay, "day")}
                      onChange={(e) => handleDateInput(e.target.value, setLoanDay, "day")}
                      maxLength={2}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={calculateLoanPeriodToToday} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    計算到今天的期間
                  </Button>
                </div>

                <div>
                  <Label>滿當日期</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      type="text"
                      placeholder="YYYY"
                      value={formatDateValue(maturityYear, "year")}
                      onChange={(e) => handleDateInput(e.target.value, setMaturityYear, "year")}
                      maxLength={4}
                    />
                    <Input
                      type="text"
                      placeholder="MM"
                      value={formatDateValue(maturityMonth, "month")}
                      onChange={(e) => handleDateInput(e.target.value, setMaturityMonth, "month")}
                      maxLength={2}
                    />
                    <Input
                      type="text"
                      placeholder="DD"
                      value={formatDateValue(maturityDay, "day")}
                      onChange={(e) => handleDateInput(e.target.value, setMaturityDay, "day")}
                      maxLength={2}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={setMaturityToThreeMonths} className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    設定為3個月後
                  </Button>
                  {maturityWarning && (
                    <Alert className="mt-2 border-red-400 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{maturityWarning}</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-xs text-gray-500 mt-1">滿當期限最短3個月，到期後5天內仍可取回並付清利息</p>
                </div>

                <div>
                  <Label htmlFor="loanPeriod">借款期間 (月)</Label>
                  <Input
                    id="loanPeriod"
                    type="number"
                    min="1"
                    step="1"
                    value={loanPeriod || ""}
                    onChange={(e) => setLoanPeriod(Number(e.target.value) || 0)}
                    placeholder="請輸入借款期間"
                  />
                  <p className="text-xs text-gray-500 mt-1">支援短期借款（最短1個月），期間會根據借款日期和滿當日期自動計算</p>
                </div>
              </CardContent>
            </Card>

            {/* 右側：還款方式和其他費用 */}
            <div className="space-y-6">
              {/* 還款方式 */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl text-gray-800">還款方式</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs space-y-2">
                          <p><strong>一次清償：</strong>到期一次還清本金和利息</p>
                          <p><strong>只還利息：</strong>每月只還利息，到期還本金</p>
                          <p><strong>彈性還款：</strong>可彈性安排還款，輸入累積清償總額</p>
                          <p><strong>本利攤還：</strong>每月攤還本金和利息</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <Select value={repaymentMethod} onValueChange={setRepaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lump-sum">一次清償</SelectItem>
                      <SelectItem value="interest-only">只還利息</SelectItem>
                      <SelectItem value="flexible">彈性還款</SelectItem>
                      <SelectItem value="amortizing">本利攤還</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2 text-sm text-gray-600">
                    {repaymentMethod === "lump-sum" && "到期一次還清本金和利息"}
                    {repaymentMethod === "interest-only" && "每月只還利息，到期還本金"}
                    {repaymentMethod === "flexible" && "彈性還款，累積清償總額"}
                    {repaymentMethod === "amortizing" && "每月攤還本金和利息"}
                  </div>
                </CardContent>
              </Card>

              {/* 其他費用 */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl text-gray-800">其他費用</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs space-y-2">
                          <p className="text-red-600 font-semibold">⚠️ 違法風險警告</p>
                          <p>根據當鋪業法，合法當鋪僅能收取<strong>利息</strong>及<strong>倉棧費</strong>。</p>
                          <p>收取其他費用（如手續費、服務費、鑑定費等）可能違反法規。</p>
                          <p>此功能僅供試算參考，請謹慎選擇合法當鋪業者。</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {otherFees.map((fee) => (
                    <div key={fee.id} className="flex gap-2">
                      <Input
                        placeholder="費用名稱"
                        value={fee.name}
                        onChange={(e) => updateOtherFee(fee.id, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="金額"
                        value={fee.amount}
                        onChange={(e) => updateOtherFee(fee.id, "amount", Number(e.target.value))}
                        className="w-32"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeOtherFee(fee.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" onClick={addOtherFee} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    新增費用項目
                  </Button>

                  {otherFees.length > 0 && totalOtherFees > 0 && (
                    <Alert className="border-red-500 bg-red-50 border-2">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <AlertDescription className="text-red-800 font-bold text-base">
                        <div className="space-y-2">
                          <div className="text-xl font-black text-red-900">⚠️ 嚴重違法風險警告</div>
                          <div>合法當鋪僅能收取<strong>利息</strong>及<strong>倉棧費</strong>，收取其他費用可能違反當鋪業法規定。</div>
                          <div className="text-red-900 font-black">其他費用總額：{formatCurrency(totalOtherFees)}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 計算結果 - 全寬度 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">計算結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">借款本金：</span>
                  <span className="font-medium">{formatCurrency(loanAmountNum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">倉棧費：</span>
                  <span className="font-medium">{formatCurrency(storageFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">計算月利率：</span>
                  <span className={`font-medium ${monthlyRate > 2.5 ? 'text-red-700 font-black text-lg' : 'text-blue-600'}`}>
                    {formatPercentage(monthlyRate)}
                    {monthlyRate > 2.5 && <span className="ml-1 text-red-600">⚠️</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">借款期間：</span>
                  <span className="font-medium">{loanPeriod} 個月</span>
                </div>
              </div>

              {/* 利息計算歷程 */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">利息計算歷程：</h4>
                <div className="space-y-1">
                  {getInterestCalculation().map((step, index) => (
                    <p key={index} className="text-blue-700 font-mono text-sm">
                      {step}
                    </p>
                  ))}
                </div>
              </div>

              {/* APR計算歷程 */}
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">APR年百分率計算歷程：</h4>
                <div className="space-y-1">
                  {getAPRCalculation().map((step, index) => (
                    <p key={index} className="text-green-700 font-mono text-sm">
                      {step}
                    </p>
                  ))}
                </div>
              </div>

              {monthlyRate > 2.5 && (
                <Alert className="border-red-500 bg-red-50 border-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <AlertDescription className="text-red-800 font-bold text-lg">
                    ⚠️ 違法警告：計算出的月利率 <span className="text-2xl font-black text-red-900">{formatPercentage(monthlyRate)}</span> 超過法定上限2.5%
                  </AlertDescription>
                </Alert>
              )}

              {otherFees.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">其他費用明細：</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {otherFees.map((fee) => (
                      <div key={fee.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{fee.name || "未命名費用"}：</span>
                        <span className="font-medium">{formatCurrency(fee.amount || 0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
                    <span>其他費用總計：</span>
                    <span>{formatCurrency(totalOtherFees)}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between text-lg font-semibold text-green-700">
                    <span>實拿金額：</span>
                    <span>{formatCurrency(actualReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">總利息支出：</span>
                    <span className="font-medium">{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">總支出費用：</span>
                    <span className="font-medium">{formatCurrency(totalExpense)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-red-700">
                    <span>總還款金額：</span>
                    <span>{formatCurrency(totalRepayment)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-xl font-bold text-blue-700">APR年百分率：{apr.toFixed(2)}%</div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-5 w-5 text-blue-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs space-y-2">
                            <p><strong>APR年百分率</strong>是年度總成本率，包含所有借款成本：</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>利息支出</li>
                              <li>倉棧費用</li>
                              <li>其他相關費用</li>
                            </ul>
                            <p className="text-sm">APR提供真實的借款成本參考，方便比較不同方案。</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 法規說明 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">法規說明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 根據當鋪業法規定，當鋪月利率不得超過2.5%</p>
                <p>• 倉棧費不得超過收當金額5%</p>
                <p>• 合法當鋪僅能收取利息及倉棧費，不得收取其他費用</p>
                <p>• 法規建議滿當期限至少3個月，本試算器支援短期借款試算</p>
                <p>• 如未在期限內取回，物品所有權將歸當鋪業者</p>
                <p>• APR年百分率包含所有借款成本，提供真實借款成本參考</p>
                <p>• 本計算器根據還款方式反推計算月利率</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}
