"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, AlertTriangle, AlertCircle, ChevronUp, ChevronDown, Calculator, Calendar } from "lucide-react"

interface OtherFee {
  id: string
  name: string
  amount: number
}

export default function PawnshopCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(100000)
  const [monthlyPayment, setMonthlyPayment] = useState<number>(2500) // 每月繳款金額
  const [totalRepaymentAmount, setTotalRepaymentAmount] = useState<number>(110000) // 累積清償總額
  const [storageRate, setStorageRate] = useState<number>(5)
  const [loanYear, setLoanYear] = useState<number>(new Date().getFullYear())
  const [loanMonth, setLoanMonth] = useState<number>(new Date().getMonth() + 1)
  const [loanDay, setLoanDay] = useState<number>(new Date().getDate())
  const [maturityYear, setMaturityYear] = useState<number>(new Date().getFullYear())
  const [maturityMonth, setMaturityMonth] = useState<number>(new Date().getMonth() + 4) // 預設3個月後
  const [maturityDay, setMaturityDay] = useState<number>(new Date().getDate())
  const [loanPeriod, setLoanPeriod] = useState<number>(3)
  const [repaymentMethod, setRepaymentMethod] = useState<string>("lump-sum")
  const [otherFees, setOtherFees] = useState<OtherFee[]>([])

  // 當還款方式改變時，更新總還款金額
  useEffect(() => {
    if (repaymentMethod === "lump-sum") {
      setTotalRepaymentAmount(Math.round(loanAmount * 1.1)) // 預設為本金 + 10%，四捨五入為整數
    }
  }, [repaymentMethod, loanAmount])

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

        const calculatedPeriod = Math.max(3, totalMonths) // 最短3個月
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
    const newPayment = increment ? monthlyPayment + step : monthlyPayment - step
    setMonthlyPayment(Math.max(0, newPayment))
  }

  // 調整總還款金額的函數
  const adjustTotalRepayment = (increment: boolean) => {
    const step = 1
    const newTotal = increment ? totalRepaymentAmount + step : totalRepaymentAmount - step
    setTotalRepaymentAmount(Math.max(loanAmount, newTotal))
  }

  // 調整倉棧費率的函數
  const adjustStorageRate = (increment: boolean) => {
    const step = 0.1
    const newRate = increment ? storageRate + step : storageRate - step
    setStorageRate(Math.max(0, Math.round(newRate * 10) / 10))
  }

  // 計算借款期間的函數（從借款日到今天）
  const calculateLoanPeriodToToday = () => {
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
      return "滿當期限不得少於3個月"
    }
    return null
  }

  // 計算基本費用（即時計算）
  const storageFee = loanAmount * (storageRate / 100)
  const totalOtherFees = otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
  const actualReceived = loanAmount - storageFee - totalOtherFees

  // 根據還款方式計算總利息（即時計算）
  const calculateTotalInterest = () => {
    if (loanAmount <= 0 || loanPeriod <= 0) return 0

    switch (repaymentMethod) {
      case "lump-sum": // 一次清償
        // 總利息 = 總還款金額 - 借款金額
        return totalRepaymentAmount - loanAmount

      case "interest-only": // 只還利息
        // 總利息 = 每月利息 × 借款期間
        return monthlyPayment * loanPeriod

      case "flexible": // 彈性還款
        // 總利息 = 總還款金額 - 借款金額
        return totalRepaymentAmount - loanAmount

      case "amortizing": // 本利攤還
        // 總利息 = (每月繳款 × 期間) - 借款金額
        return monthlyPayment * loanPeriod - loanAmount

      default:
        return 0
    }
  }

  // 從總利息反推月利率（即時計算）
  const calculateMonthlyRate = () => {
    const totalInterest = calculateTotalInterest()

    if (loanAmount <= 0 || loanPeriod <= 0 || totalInterest <= 0) return 0

    switch (repaymentMethod) {
      case "lump-sum": // 一次清償
      case "flexible": // 彈性還款
        // 月利率 = 總利息 ÷ (借款金額) × 100%
        return (totalInterest / (loanAmount * loanPeriod)) * 100

      case "interest-only": // 只還利息
        // 月利率 = 每月利息 ÷ 借款金額 × 100%
        return (monthlyPayment / loanAmount) * 100

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

    for (let i = 0; i < maxIterations; i++) {
      const calculatedPayment =
        (loanAmount * (rate * Math.pow(1 + rate, loanPeriod))) / (Math.pow(1 + rate, loanPeriod) - 1)

      if (Math.abs(calculatedPayment - monthlyPayment) < tolerance) {
        return rate * 100 // 轉換為百分比
      }

      // 調整利率
      if (calculatedPayment > monthlyPayment) {
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
  const totalRepayment = loanAmount + totalExpense

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
          `2. 總還款金額 = ${formatNum(totalRepaymentAmount)}`,
          `3. 借款金額 = ${formatNum(loanAmount)}`,
          `4. 總利息 = ${formatNum(totalRepaymentAmount)} - ${formatNum(loanAmount)} = ${formatNum(totalInterest)}`,
          `5. 月利率 = ${formatNum(totalInterest)} ÷ (${formatNum(loanAmount)} × ${loanPeriod}) × 100% = ${formatPercent(monthlyRate)}%`,
        ]
      case "interest-only":
        return [
          `1. 還款方式：只還利息`,
          `2. 每月利息 = ${formatNum(monthlyPayment)}`,
          `3. 借款期間 = ${loanPeriod} 個月`,
          `4. 總利息 = ${formatNum(monthlyPayment)} × ${loanPeriod} = ${formatNum(totalInterest)}`,
          `5. 月利率 = ${formatNum(monthlyPayment)} ÷ ${formatNum(loanAmount)} × 100% = ${formatPercent(monthlyRate)}%`,
        ]
      case "flexible":
        return [
          `1. 還款方式：彈性還款`,
          `2. 累積清償總額 = ${formatNum(totalRepaymentAmount)}`,
          `3. 借款金額 = ${formatNum(loanAmount)}`,
          `4. 總利息 = ${formatNum(totalRepaymentAmount)} - ${formatNum(loanAmount)} = ${formatNum(totalInterest)}`,
          `5. 月利率 = ${formatNum(totalInterest)} ÷ (${formatNum(loanAmount)} × ${loanPeriod}) × 100% = ${formatPercent(monthlyRate)}%`,
        ]
      case "amortizing":
        return [
          `1. 還款方式：本利攤還`,
          `2. 每月繳款 = ${formatNum(monthlyPayment)}`,
          `3. 借款期間 = ${loanPeriod} 個月`,
          `4. 總還款 = ${formatNum(monthlyPayment)} × ${loanPeriod} = ${formatNum(monthlyPayment * loanPeriod)}`,
          `5. 總利息 = ${formatNum(monthlyPayment * loanPeriod)} - ${formatNum(loanAmount)} = ${formatNum(totalInterest)}`,
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
      `3. 實拿金額 = ${formatNum(loanAmount)} - ${formatNum(storageFee)} - ${formatNum(totalOtherFees)} = ${formatNum(actualReceived)}`,
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
  const showMonthlyPayment = repaymentMethod === "interest-only" || repaymentMethod === "amortizing"
  const showTotalRepayment = repaymentMethod === "lump-sum" || repaymentMethod === "flexible"

  return (
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
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                {/* 根據還款方式顯示不同的輸入欄位 */}
                {showMonthlyPayment && (
                  <div>
                    <Label htmlFor="monthlyPayment">每月繳款金額 (NT$)</Label>
                    <div className="flex">
                      <Input
                        id="monthlyPayment"
                        type="number"
                        step="100"
                        min="0"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                        className="rounded-r-none"
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
                        type="number"
                        min={loanAmount}
                        value={totalRepaymentAmount}
                        onChange={(e) => setTotalRepaymentAmount(Number(e.target.value))}
                        className="rounded-r-none"
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
                  <Label htmlFor="storageRate">倉棧費率 (%)</Label>
                  <div className="flex">
                    <Input
                      id="storageRate"
                      type="number"
                      step="0.1"
                      min="0"
                      value={storageRate}
                      onChange={(e) => setStorageRate(Number(e.target.value))}
                      className="rounded-r-none"
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
                  {storageRate > 5 && (
                    <Alert className="mt-2 border-yellow-400 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">倉棧費率超過法定上限5%</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <Label>借款日期</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      type="number"
                      placeholder="年"
                      value={loanYear}
                      onChange={(e) => setLoanYear(Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="月"
                      min="1"
                      max="12"
                      value={loanMonth}
                      onChange={(e) => setLoanMonth(Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="日"
                      min="1"
                      max="31"
                      value={loanDay}
                      onChange={(e) => setLoanDay(Number(e.target.value))}
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
                      type="number"
                      placeholder="年"
                      value={maturityYear}
                      onChange={(e) => setMaturityYear(Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="月"
                      min="1"
                      max="12"
                      value={maturityMonth}
                      onChange={(e) => setMaturityMonth(Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="日"
                      min="1"
                      max="31"
                      value={maturityDay}
                      onChange={(e) => setMaturityDay(Number(e.target.value))}
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
                    value={loanPeriod}
                    onChange={(e) => setLoanPeriod(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">期間會根據借款日期和滿當日期自動計算</p>
                </div>
              </CardContent>
            </Card>

            {/* 右側：還款方式和其他費用 */}
            <div className="space-y-6">
              {/* 還款方式 */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">還款方式</CardTitle>
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
                  <CardTitle className="text-xl text-gray-800">其他費用</CardTitle>
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
                    <Alert className="border-red-400 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>違法風險警告：</strong>合法當鋪僅能收取利息及倉棧費，收取其他費用可能違反當鋪業法規定。
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
                  <span className="font-medium">{formatCurrency(loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">倉棧費：</span>
                  <span className="font-medium">{formatCurrency(storageFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">計算月利率：</span>
                  <span className="font-medium text-blue-600">{formatPercentage(monthlyRate)}</span>
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
                <Alert className="border-yellow-400 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    計算出的月利率 {formatPercentage(monthlyRate)} 超過法定上限2.5%
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
                    <div className="text-xl font-bold text-blue-700">APR年百分率：{apr.toFixed(2)}%</div>
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
                <p>• 滿當期限最短3個月，到期後5天內仍可取回並付清利息</p>
                <p>• 如未在期限內取回，物品所有權將歸當鋪業者</p>
                <p>• APR年百分率包含所有借款成本，提供真實借款成本參考</p>
                <p>• 本計算器根據還款方式反推計算月利率</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
