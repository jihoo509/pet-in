import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { PrivacyPolicyDialog } from './PrivacyPolicyDialog';
import UtmHiddenFields from './UtmHiddenFields';
import { ContentType } from '../lib/policyContents';
import { Textarea } from './ui/textarea';
import { User, PawPrint } from 'lucide-react';

interface OnlineAnalysisFormProps {
  title?: string;
}

export function OnlineAnalysisForm({ title }: OnlineAnalysisFormProps) {
  const [formData, setFormData] = useState({
    // 가입자 정보
    name: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    notes: '',
    // 반려동물 정보
    petBreed: '',
    petName: '',
    petGender: '',
    petBirthDate: '',
    petRegNumber: '',
    petNeutered: '',
  });

  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToThirdParty, setAgreedToThirdParty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentType, setModalContentType] = useState<ContentType | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const phoneNumberInputRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    if (inputRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthDate: '',
      gender: '',
      phoneNumber: '',
      notes: '',
      petBreed: '',
      petName: '',
      petGender: '',
      petBirthDate: '',
      petRegNumber: '',
      petNeutered: '',
    });
    setAgreedToPrivacy(false);
    setAgreedToThirdParty(false);
  };

  const handleOpenModal = (type: ContentType) => {
    setModalContentType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContentType(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!agreedToPrivacy || !agreedToThirdParty) {
      alert('모든 약관에 동의해주셔야 신청이 가능합니다.');
      return;
    }
    setIsSubmitting(true);

    const formElements = Object.fromEntries(new FormData(event.currentTarget).entries());
    const now = new Date();
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    try {
      const payload = {
        type: 'online' as const,
        site: '펫보험',
        name: formData.name.trim(),
        phone: `010-${(formData.phoneNumber || '').trim()}`,
        birth: formData.birthDate.trim(),
        gender: formData.gender as '남' | '여' | '',
        notes: formData.notes.trim(),
        petBreed: formData.petBreed.trim(),
        petName: formData.petName.trim(),
        petGender: formData.petGender,
        petBirthDate: formData.petBirthDate.trim(),
        petRegNumber: formData.petRegNumber.trim(),
        petNeutered: formData.petNeutered,
        requestedAt: kstDate.toISOString(),
        ...formElements,
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
      alert('✅ 온라인 분석 신청이 정상적으로 접수되었습니다!');
      resetForm();
    } catch (err: any) {
      console.error('온라인 분석 제출 오류:', err);
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
          <p className="text-white text-[22px] md:text-2xl font-extrabold tracking-tight">한 눈에 비교 분석할 수 있는</p>
          <p className="text-[22px] md:text-2xl font-black bg-gradient-to-b from-[#FFB648] to-[#FF7A3D] bg-clip-text text-transparent">이미지 파일을 보내드립니다.</p>
          {title && <p className="mt-2 text-white/85 text-[13px] md:text-sm">{title}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <UtmHiddenFields />

          {/* 가입자 정보 섹션 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
              <User size={18} className="text-white/80" />
            </div>
            <h3 className="text-white font-bold text-lg">가입자 정보</h3>
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 이름</label>
            <Input ref={nameInputRef} placeholder="가입자 성함을 입력" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} onFocus={() => handleInputFocus(nameInputRef)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 생년월일</label>
            <Input ref={birthDateInputRef} placeholder="생년월일 8자리 (예: 19850101)" value={formData.birthDate} onChange={e => handleInputChange('birthDate', e.target.value)} onFocus={() => handleInputFocus(birthDateInputRef)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" maxLength={8} required />
          </div>
          <div className="space-y-2">
            <label className="text-white text-base block">가입자 성별</label>
            <div className="flex h-12 bg-white rounded-md overflow-hidden">
              <Button type="button" onClick={() => handleInputChange('gender', '남')} className={`flex-1 flex items-center justify-center space-x-2 rounded-none h-full border-0 ${formData.gender === '남' ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}> <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.gender === '남' ? 'bg-orange-400' : 'bg-gray-300'}`}>👨</div> <span>남</span> </Button>
              <Button type="button" onClick={() => handleInputChange('gender', '여')} className={`flex-1 flex items-center justify-center space-x-2 rounded-none h-full border-0 ${formData.gender === '여' ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}> <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.gender === '여' ? 'bg-orange-400' : 'bg-gray-300'}`}>👩</div> <span>여</span> </Button>
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

          {/* 반려동물 정보 섹션 */}
          <div className="pt-6 mt-6 border-t border-dashed border-white/20">
             <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
                <PawPrint size={18} className="text-white/80" />
              </div>
              <h3 className="text-white font-bold text-lg">반려동물 정보</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-white text-base block">반려동물 품종</label>
                <Input placeholder="예: 강아지 말티즈" value={formData.petBreed} onChange={e => handleInputChange('petBreed', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" required />
              </div>
              <div className="space-y-2">
                <label className="text-white text-base block">반려동물 이름</label>
                <Input placeholder="우리 아이 이름" value={formData.petName} onChange={e => handleInputChange('petName', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" required />
              </div>
              <div className="space-y-2">
                <label className="text-white text-base block">반려동물 성별</label>
                <div className="flex h-12 bg-white rounded-md overflow-hidden">
                  <Button type="button" onClick={() => handleInputChange('petGender', '수컷')} className={`flex-1 flex items-center justify-center space-x-2 rounded-none h-full border-0 ${formData.petGender === '수컷' ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}> <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl ${formData.petGender === '수컷' ? 'bg-orange-400' : 'bg-gray-300'}`}>♂</div> <span>수컷</span> </Button>
                  <Button type="button" onClick={() => handleInputChange('petGender', '암컷')} className={`flex-1 flex items-center justify-center space-x-2 rounded-none h-full border-0 ${formData.petGender === '암컷' ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}> <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl ${formData.petGender === '암컷' ? 'bg-orange-400' : 'bg-gray-300'}`}>♀</div> <span>암컷</span> </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-white text-base block">반려동물 생년월일</label>
                <Input placeholder="8자리 입력 (예: 20230101)" value={formData.petBirthDate} onChange={e => handleInputChange('petBirthDate', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" maxLength={8} required />
              </div>
              <div className="space-y-2">
                <label className="text-white text-base block">동물등록번호</label>
                <Input placeholder="등록 진행했을 시 입력" value={formData.petRegNumber} onChange={e => handleInputChange('petRegNumber', e.target.value)} className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500" />
              </div>
              <div className="space-y-2">
                <label className="text-white text-base block">중성화 여부</label>
                <div className="flex h-12 bg-white rounded-md overflow-hidden">
                  <Button type="button" onClick={() => handleInputChange('petNeutered', '예')} className={`flex-1 rounded-none h-full border-0 ${formData.petNeutered === '예' ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>예</Button>
                  <Button type="button" onClick={() => handleInputChange('petNeutered', '아니오')} className={`flex-1 rounded-none h-full border-0 ${formData.petNeutered === '아니오' ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>아니오</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-white text-base block">문의사항</label>
            <Textarea placeholder="궁금한 점이나 특별히 원하는 점이 있다면 자유롭게 적어주세요." value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} className="bg-white border-0 text-gray-800 placeholder:text-gray-500" rows={3}/>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <label htmlFor="online-privacy-agreement" className="flex items-center space-x-2 text-white text-base cursor-pointer">
                <Checkbox id="online-privacy-agreement" checked={agreedToPrivacy} onCheckedChange={checked => setAgreedToPrivacy(!!checked)} className="border-white data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b]" />
                <span>개인정보 수집 및 이용동의</span>
              </label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleOpenModal('privacy')} className="bg-white text-gray-800 border-white hover:bg-gray-100 h-8 px-3"> 자세히 보기 </Button>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="online-third-party-agreement" className="flex items-center space-x-2 text-white text-base cursor-pointer">
                <Checkbox id="online-third-party-agreement" checked={agreedToThirdParty} onCheckedChange={checked => setAgreedToThirdParty(!!checked)} className="border-white data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b]" />
                <span>제3자 제공 동의</span>
              </label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleOpenModal('thirdParty')} className="bg-white text-gray-800 border-white hover:bg-gray-100 h-8 px-3"> 자세히 보기 </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                !formData.name || !formData.birthDate || !formData.gender || !formData.phoneNumber || 
                !formData.petBreed || !formData.petName || !formData.petGender || !formData.petBirthDate || !formData.petNeutered ||
                !agreedToPrivacy || !agreedToThirdParty || 
                isSubmitting
              }
              className="w-full h-14 bg-[#f59e0b] hover:bg-[#d97706] text-white text-xl disabled:opacity-50"
            >
              {isSubmitting ? '신청 중...' : '온라인분석 신청하기'}
            </Button>
          </div>
        </form>
      </div>

      <PrivacyPolicyDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAgree={() => {
          if (modalContentType === 'privacy') {
            setAgreedToPrivacy(true);
          } else if (modalContentType === 'thirdParty') {
            setAgreedToThirdParty(true);
          }
        }}
        formType="online"
        contentType={modalContentType}
      />
    </div>
  );
}

