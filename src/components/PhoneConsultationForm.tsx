import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { PrivacyPolicyDialog } from './PrivacyPolicyDialog';

interface PhoneConsultationFormProps {
  title?: string;
}

export function PhoneConsultationForm({ title }: PhoneConsultationFormProps) {
  const [formData, setFormData] = useState({
    // 가입자 정보
    name: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    agreedToTerms: false,

    // ✨ 반려동물 정보 추가
    petBreed: '',
    petName: '',
    petGender: '',
    petBirthDate: '',
    petRegNumber: '',
    petNeutered: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const phoneNumberInputRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () =>
    setFormData({
      name: '',
      birthDate: '',
      gender: '',
      phoneNumber: '',
      agreedToTerms: false,
      petBreed: '',
      petName: '',
      petGender: '',
      petBirthDate: '',
      petRegNumber: '',
      petNeutered: '',
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const now = new Date();
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));

    try {
      const payload = {
        type: 'phone' as const,
        site: '펫보험', // 또는 현재 사이트에 맞게 수정
        // 가입자 정보
        name: formData.name.trim(),
        phone: `010-${(formData.phoneNumber || '').trim()}`,
        birth: formData.birthDate.trim(),
        gender: formData.gender as '남' | '여' | '',
        
        // ✨ 반려동물 정보 추가
        petBreed: formData.petBreed.trim(),
        petName: formData.petName.trim(),
        petGender: formData.petGender,
        petBirthDate: formData.petBirthDate.trim(),
        petRegNumber: formData.petRegNumber.trim(),
        petNeutered: formData.petNeutered,

        requestedAt: kstDate.toISOString(),
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `서버 오류(${res.status})`);
      }

      alert('✅ 전화 상담 신청이 정상적으로 접수되었습니다!');
      resetForm();
    } catch (err: any) {
      console.error('전화상담 제출 오류:', err);
      alert('제출 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div
        className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
        style={{ boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4)` }}
      >
        <div className="text-center space-y-1.5 mb-5">
          <p className="text-white text-[22px] md:text-2xl font-extrabold tracking-tight">
            보험 전문가가 유선상으로
          </p>
          <p className="text-[22px] md:text-2xl font-black bg-gradient-to-b from-[#FFB648] to-[#FF7A3D] bg-clip-text text-transparent">
            보다 자세한 설명을 해드립니다.
          </p>
          {title && <p className="mt-2 text-white/85 text-[13px] md:text-sm">{title}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 가입자 정보 */}
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 이름</label>
            <Input ref={nameInputRef} placeholder="가입자 성함을 입력" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} onFocus={() => handleInputFocus(nameInputRef)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 생년월일</label>
            <Input ref={birthDateInputRef} placeholder="생년월일 8자리 (예:19850101)" value={formData.birthDate} onChange={e => handleInputChange('birthDate', e.target.value)} onFocus={() => handleInputFocus(birthDateInputRef)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" maxLength={8} required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 성별</label>
            <div className="flex h-12 bg-white rounded-md overflow-hidden">
              <Button type="button" onClick={() => handleInputChange('gender', '남')} className={`flex-1 rounded-none h-full border-0 ${formData.gender === '남' ? 'bg-[#f59e0b] text-white' : 'bg-white text-gray-600'}`}>남</Button>
              <Button type="button" onClick={() => handleInputChange('gender', '여')} className={`flex-1 rounded-none h-full border-0 ${formData.gender === '여' ? 'bg-[#f59e0b] text-white' : 'bg-white text-gray-600'}`}>여</Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 전화번호</label>
            <div className="flex space-x-2">
              <div className="bg-white rounded-md px-3 py-3 text-gray-800 text-base w-16 text-center">010</div>
              <span className="text-white text-2xl flex items-center">-</span>
              <Input ref={phoneNumberInputRef} placeholder="휴대폰번호 8자리" value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} onFocus={() => handleInputFocus(phoneNumberInputRef)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500 flex-1" maxLength={8} required />
            </div>
          </div>

          {/* 구분선 */}
          <hr className="border-white/20 my-4" />

          {/* 반려동물 정보 */}
          <div className="space-y-2">
            <label className="text-white text-base block">반려동물 품종</label>
            <Input placeholder="예: 말티즈, 코리안숏헤어" value={formData.petBreed} onChange={e => handleInputChange('petBreed', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">반려동물 이름</label>
            <Input placeholder="우리 아이 이름" value={formData.petName} onChange={e => handleInputChange('petName', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">반려동물 성별</label>
            <div className="flex h-12 bg-white rounded-md overflow-hidden">
              <Button type="button" onClick={() => handleInputChange('petGender', '수컷')} className={`flex-1 rounded-none h-full border-0 ${formData.petGender === '수컷' ? 'bg-[#f59e0b] text-white' : 'bg-white text-gray-600'}`}>수컷</Button>
              <Button type="button" onClick={() => handleInputChange('petGender', '암컷')} className={`flex-1 rounded-none h-full border-0 ${formData.petGender === '암컷' ? 'bg-[#f59e0b] text-white' : 'bg-white text-gray-600'}`}>암컷</Button>
            </div>
          </div>
           <div className="space-y-2">
            <label className="text-white text-base block">반려동물 생년월일</label>
            <Input placeholder="8자리 입력 (예: 20230101)" value={formData.petBirthDate} onChange={e => handleInputChange('petBirthDate', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" maxLength={8} required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">등록번호(등록병원)</label>
            <Input placeholder="선택사항" value={formData.petRegNumber} onChange={e => handleInputChange('petRegNumber', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">중성화 여부</label>
            <div className="flex h-12 bg-white rounded-md overflow-hidden">
              <Button type="button" onClick={() => handleInputChange('petNeutered', '예')} className={`flex-1 rounded-none h-full border-0 ${formData.petNeutered === '예' ? 'bg-[#f59e0b] text-white' : 'bg-white text-gray-600'}`}>예</Button>
              <Button type="button" onClick={() => handleInputChange('petNeutered', '아니오')} className={`flex-1 rounded-none h-full border-0 ${formData.petNeutered === '아니오' ? 'bg-[#f59e0b] text-white' : 'bg-white text-gray-600'}`}>아니오</Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="phone-terms-agreement" checked={formData.agreedToTerms} onCheckedChange={checked => handleInputChange('agreedToTerms', !!checked)} className="border-white data-[state=checked]:bg-[#f59e0b]" />
              <label htmlFor="phone-terms-agreement" className="text-white text-base cursor-pointer">개인정보 수집 및 이용동의</label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPrivacyDialog(true)} className="bg-white text-gray-800 border-white">자세히 보기</Button>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={!formData.name || !formData.birthDate || !formData.gender || !formData.phoneNumber || !formData.agreedToTerms || isSubmitting} className="w-full h-14 bg-[#f59e0b] hover:bg-[#d97706] text-white text-xl disabled:opacity-50">
              {isSubmitting ? '신청 중...' : '전화상담 신청하기'}
            </Button>
          </div>
        </form>
      </div>
      <PrivacyPolicyDialog isOpen={showPrivacyDialog} onClose={() => setShowPrivacyDialog(false)} />
    </div>
  );
}