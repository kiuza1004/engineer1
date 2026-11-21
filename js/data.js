/**
 * 산업기사 자격증 시험공부 데이터셋
 * 1. 기본정보 (개요, 응시자격, 시험일정, 합격기준, 핵심요약)
 * 2. 기출문제 (회차별/과목별 실전문항, 상세해설)
 * 3. 기출변형 응용문제 (신유형 변형, 함정포인트, 변형대비 해설)
 */

const APP_DATA = {
  // 1. 기본 정보 메뉴 데이터
  info: {
    qualifications: [
      {
        id: "info_tech",
        name: "정보처리산업기사",
        engName: "Industrial Engineer Information Processing",
        category: "정보기술 / 소프트웨어",
        agency: "한국산업인력공단 (Q-Net)",
        overview: "소프트웨어 개발 관련 지식을 바탕으로 정보시스템의 분석, 설계, 구현, 시험, 유지보수 등의 업무를 수행할 수 있는 실무 엔지니어를 양성하기 위한 국가기술자격입니다.",
        careerProspect: "SW개발사, 금융권 전산실, SI(시스템통합) 기업, 공공기관 및 IT 계열 취업 시 서류 가산점 및 정보통신기술자 초급 기술자 등급 인정.",
        examFee: "필기: 19,400원 / 실기: 20,800원",
        schedule: [
          { round: "2025년 제1회", apply: "2025.01.13 ~ 01.16", exam: "2025.02.15 ~ 03.07", result: "2025.03.19" },
          { round: "2025년 제2회", apply: "2025.04.14 ~ 04.17", exam: "2025.05.10 ~ 05.30", result: "2025.06.18" },
          { round: "2025년 제3회", apply: "2025.06.16 ~ 06.19", exam: "2025.07.05 ~ 07.27", result: "2025.08.20" }
        ],
        eligibility: [
          { type: "관련학과 졸업자", detail: "전문대학(2년제/3년제) 관련학과 졸업자 또는 졸업예정자, 4년제 대학 2학년(또는 1/2) 이상 수료자" },
          { type: "기술자격 소지자", detail: "동일(유사)분야 다른 산업기사 취득자, 또는 기능사 취득 후 관련 실무경력 1년 이상자" },
          { type: "순수 실무경력자", detail: "동일 및 유사 직무분야 실무경력 2년 이상인 자" },
          { type: "학점은행제", detail: "학점인정법에 따라 관련 전공 포함 41학점 이상 취득(인정)된 자" }
        ],
        examStructure: {
          written: {
            title: "필기시험 (CBT 방식)",
            method: "객관식 4지 택일형",
            questions: "과목당 20문항 (총 60문항)",
            duration: "과목당 30분 (총 1시간 30분)",
            passStandard: "100점 만점 기준 과목당 40점 이상(과락 방지) + 전과목 평균 60점 이상 합격",
            subjects: [
              { name: "1과목: 정보시스템 기반 기술", questions: 20, desc: "운영체제, 네트워크, 데이터베이스 기본 구조" },
              { name: "2과목: 프로그래밍 언어 활용", questions: 20, desc: "C, Java, Python 문법, 알고리즘, 자료구조" },
              { name: "3과목: 데이터베이스 활용", questions: 20, desc: "SQL 문법, 정규화, 트랜잭션, 관계대수" }
            ]
          },
          practical: {
            title: "실기시험",
            method: "필답형 (주관식 단답형/서술형/코드작성)",
            duration: "2시간 30분",
            passStandard: "100점 만점 기준 60점 이상 득점 시 최종 합격"
          }
        },
        summaries: [
          {
            subject: "1과목 핵심 요약 (정보시스템 기반)",
            points: [
              "OSI 7계층 (물-데-네-전-세-표-응): 물리(리피터/허브), 데이터링크(브리지/스위치-MAC주소), 네트워크(라우터-IP주소), 전송(TCP/UDP-Port)",
              "교착상태(Deadlock) 4대 필요조건: 상호배제(Mutual Exclusion), 점유와 대기(Hold & Wait), 비선점(Non-preemption), 환형대기(Circular Wait)",
              "페이지 교체 알고리즘: FIFO(선입선출), LRU(최근에 가장 오랫동안 사용되지 않은 것), LFU(참조 횟수가 가장 적은 것)"
            ]
          },
          {
            subject: "2과목 핵심 요약 (프로그래밍 언어)",
            points: [
              "C언어 포인터: * 연산자는 역참조(값), & 연산자는 주소 반환. 배열명은 첫 번째 요소의 시작 주소",
              "객체지향(OOP) 4대 특징: 캡슐화(Encapsulation), 상속(Inheritance), 다형성(Polymorphism), 추상화(Abstraction)",
              "Python 슬라이싱: list[start:end:step] - end는 포함되지 않음, 음수 인덱스는 역순"
            ]
          },
          {
            subject: "3과목 핵심 요약 (데이터베이스)",
            points: [
              "정규화 과정 암기: 도-부-이-결-다-조 (1NF: 원자값, 2NF: 부분함수종속 제거, 3NF: 이행적함수종속 제거, BCNF: 결정자이면서 후보키아닌것 제거, 4NF: 다치종속, 5NF: 조인종속)",
              "트랜잭션 ACID 특징: 원자성(Atomicity), 일관성(Consistency), 격리성(Isolation), 영속성(Durability)",
              "SQL 분류: DDL(CREATE, ALTER, DROP), DML(SELECT, INSERT, UPDATE, DELETE), DCL(GRANT, REVOKE, COMMIT, ROLLBACK)"
            ]
          }
        ]
      },
      {
        id: "safety_tech",
        name: "산업안전산업기사",
        engName: "Industrial Safety Industrial Engineer",
        category: "안전관리",
        agency: "한국산업인력공단 (Q-Net)",
        overview: "산업 현장의 근로자 안전을 위협하는 위험 요소를 사전에 발굴하고, 산업재해 예방 계획 수립 및 안전관리 업무를 전담하는 필수 법정 자격증입니다.",
        careerProspect: "중대재해처벌법 및 산업안전보건법에 따른 제조업, 건설업 현장 법정 안전관리자 선임 필수 자격.",
        examFee: "필기: 19,400원 / 실기: 34,600원",
        schedule: [
          { round: "2025년 제1회", apply: "2025.01.13 ~ 01.16", exam: "2025.02.15 ~ 03.07", result: "2025.03.19" },
          { round: "2025년 제2회", apply: "2025.04.14 ~ 04.17", exam: "2025.05.10 ~ 05.30", result: "2025.06.18" },
          { round: "2025년 제3회", apply: "2025.06.16 ~ 06.19", exam: "2025.07.05 ~ 07.27", result: "2025.08.20" }
        ],
        eligibility: [
          { type: "관련학과 졸업자", detail: "전문대학 안전공학 관련학과 졸업(예정)자, 비관련학과 졸업 시 실무경력 요구" },
          { type: "기능사 소지자", detail: "기능사 자격증 취득 후 실무 1년 이상" },
          { type: "순수 실무경력자", detail: "동일 및 유사 직무분야 실무경력 2년 이상" },
          { type: "학점은행제", detail: "학점인정법에 의한 41학점 이상 취득자" }
        ],
        examStructure: {
          written: {
            title: "필기시험 (CBT 방식)",
            method: "객관식 4지 택일형",
            questions: "과목당 20문항 (총 100문항, 5과목)",
            duration: "2시간 30분",
            passStandard: "과목당 40점 이상, 전과목 평균 60점 이상",
            subjects: [
              { name: "1과목: 산업안전관리론", questions: 20, desc: "안전관리조직, 재해통계, 안전교육" },
              { name: "2과목: 인간공학 및 시스템안전공학", questions: 20, desc: "신뢰도 계산, 결함수분석(FTA)" },
              { name: "3과목: 기계위험방지기술", questions: 20, desc: "프레스, 롤러기 방호장치" },
              { name: "4과목: 전기 및 화학설비 위험방지", questions: 20, desc: "누전, 정전기, 인화물질" },
              { name: "5과목: 건설안전기술", questions: 20, desc: "추락, 비계, 거푸집 안전기준" }
            ]
          },
          practical: {
            title: "실기시험 (복합형)",
            method: "필답형 (55점) + 동영상 작업형 (45점)",
            duration: "필답형 1시간 + 동영상 1시간",
            passStandard: "100점 만점 중 총 60점 이상"
          }
        },
        summaries: [
          {
            subject: "산업안전 핵심 공식",
            points: [
              "하인리히 법칙: 1 (중상) : 29 (경상) : 300 (무상해 사고/잠재적 위험)",
              "도수율(빈도율): (재해건수 / 연근로총시간수) × 1,000,000",
              "강도율: (근로손실일수 / 연근로총시간수) × 1,000"
            ]
          }
        ]
      }
    ]
  },

  // 2. 기출문제 메뉴 데이터 (CBT 기출 복원 및 실전 문항)
  pastExams: [
    {
      id: "ip_2024_01",
      certId: "info_tech",
      certName: "정보처리산업기사",
      round: "2024년 1회 기출문제",
      totalQuestions: 10,
      timeLimitMinutes: 20,
      questions: [
        {
          id: 1,
          subject: "1과목: 정보시스템 기반 기술",
          question: "OSI 7계층 참조 모델에서 물리적인 전송 매체를 거쳐 비트(Bit) 단위의 데이터를 주고받는 프로토콜 계층에 해당하는 것은?",
          options: [
            "데이터링크 계층 (Data Link Layer)",
            "물리 계층 (Physical Layer)",
            "네트워크 계층 (Network Layer)",
            "전송 계층 (Transport Layer)"
          ],
          answer: 1, // 0-indexed (2번: 물리 계층)
          explanation: "물리 계층(Physical Layer)은 최하위 1계층으로, 전기적/광학적 신호를 사용하여 실제 전송 매체를 통해 0과 1의 비트(Bit) 열을 그대로 전달하는 역할을 합니다. 대표 장비로 리피터(Repeater), 허브(Hub)가 있습니다."
        },
        {
          id: 2,
          subject: "1과목: 정보시스템 기반 기술",
          question: "운영체제에서 교착상태(Deadlock)가 발생하기 위해 반드시 성립해야 하는 4가지 조건에 해당하지 않는 것은?",
          options: [
            "상호 배제 (Mutual Exclusion)",
            "점유와 대기 (Hold and Wait)",
            "선점 허용 (Preemption Allowed)",
            "환형 대기 (Circular Wait)"
          ],
          answer: 2,
          explanation: "교착상태의 4대 필요조건은 '상호배제', '점유와 대기', '비선점(Non-preemption)', '환형대기'입니다. '선점 허용'이 아니라 프로세스가 자원을 스스로 반납할 때까지 강제로 빼앗을 수 없는 '비선점' 상태여야 교착상태가 발생합니다."
        },
        {
          id: 3,
          subject: "1과목: 정보시스템 기반 기술",
          question: "메모리 관리 기법 중 가상 기억장치의 페이지 교체 알고리즘에서 가장 오랫동안 참조되지 않은 페이지를 교체 대상으로 선택하는 기법은?",
          options: [
            "FIFO (First-In, First-Out)",
            "LRU (Least Recently Used)",
            "LFU (Least Frequently Used)",
            "NUR (Not Used Recently)"
          ],
          answer: 1,
          explanation: "LRU(Least Recently Used)는 최근에 사용된 시점이 가장 오래된(가장 오랫동안 사용되지 않은) 페이지를 교체하는 방식입니다. LFU는 사용 횟수(빈도수)가 가장 적은 페이지를 교체합니다."
        },
        {
          id: 4,
          subject: "2과목: 프로그래밍 언어 활용",
          question: "다음 C언어 코드의 실행 결과로 올바른 것은?\n\n#include <stdio.h>\nint main() {\n    int a = 10, b = 20;\n    int *p = &a;\n    *p += 5;\n    p = &b;\n    *p -= 10;\n    printf(\"%d, %d\", a, b);\n    return 0;\n}",
          options: [
            "10, 20",
            "15, 10",
            "15, 20",
            "10, 10"
          ],
          answer: 1,
          explanation: "1) *p = &a로 a를 가리킨 후 *p += 5로 a의 값이 10+5=15가 됨.\n2) p = &b로 b의 주소를 가리키도록 변경한 뒤 *p -= 10으로 b의 값이 20-10=10이 됨.\n따라서 a는 15, b는 10이 출력됩니다."
        },
        {
          id: 5,
          subject: "2과목: 프로그래밍 언어 활용",
          question: "객체지향 프로그래밍(OOP)에서 동일한 인터페이스나 메소드 호출에 대해 각 객체가 서로 다른 방식으로 동작하거나 구현될 수 있는 능력을 의미하는 것은?",
          options: [
            "캡슐화 (Encapsulation)",
            "상속성 (Inheritance)",
            "다형성 (Polymorphism)",
            "정보 은닉 (Information Hiding)"
          ],
          answer: 2,
          explanation: "다형성(Polymorphism)은 하나의 메소드나 함수명이 오버로딩(Overloading) 또는 오버라이딩(Overriding)을 통해 상황과 객체 타입에 따라 서로 다른 기능을 수행하는 객체지향의 핵심 특징입니다."
        },
        {
          id: 6,
          subject: "2과목: 프로그래밍 언어 활용",
          question: "다음 파이썬(Python) 코드의 실행 결과는?\n\nnums = [10, 20, 30, 40, 50]\nprint(nums[1:4])",
          options: [
            "[10, 20, 30]",
            "[20, 30, 40]",
            "[20, 30, 40, 50]",
            "[10, 20, 30, 40]"
          ],
          answer: 1,
          explanation: "파이썬 슬라이싱 nums[start:end]에서 end 인덱스는 포함되지 않습니다(start <= index < end). 따라서 인덱스 1(값 20), 인덱스 2(값 30), 인덱스 3(값 40)까지 슬라이스되어 [20, 30, 40]이 출력됩니다."
        },
        {
          id: 7,
          subject: "3과목: 데이터베이스 활용",
          question: "관계 데이터베이스 정규화 과정에서 제1정규형(1NF) 조건을 만족하는 릴레이션이 기본키가 아닌 모든 속성이 기본키에 '완전 함수적 종속'을 만족할 때 달성되는 정규형은?",
          options: [
            "제2정규형 (2NF)",
            "제3정규형 (3NF)",
            "보이스/코드 정규형 (BCNF)",
            "제4정규형 (4NF)"
          ],
          answer: 0,
          explanation: "제2정규형(2NF)은 1NF를 만족하고, 복합 기본키의 일부분에 종속되는 '부분 함수적 종속'을 제거하여 모든 비주요 속성이 기본키에 완전 함수 종속(Full Functional Dependency)되도록 분해한 정규형입니다."
        },
        {
          id: 8,
          subject: "3과목: 데이터베이스 활용",
          question: "트랜잭션(Transaction)의 4대 특징(ACID) 중 트랜잭션 내의 모든 연산이 데이터베이스에 완전히 반영되거나, 전혀 반영되지 않아야 함(All or Nothing)을 보장하는 특성은?",
          options: [
            "일관성 (Consistency)",
            "원자성 (Atomicity)",
            "격리성 (Isolation)",
            "지속성 (Durability)"
          ],
          answer: 1,
          explanation: "원자성(Atomicity)은 트랜잭션의 작업 단위가 분리될 수 없는 단일 작업으로 취급되어 전부 성공(Commit)하거나 전부 취소(Rollback)되어 원상태로 복구되어야 한다는 원칙입니다."
        },
        {
          id: 9,
          subject: "3과목: 데이터베이스 활용",
          question: "다음 SQL 문장 중 테이블의 구조 자체를 변경할 때 사용하는 DDL(데이터 정의어) 명령어는?",
          options: [
            "UPDATE",
            "ALTER",
            "MODIFY",
            "CHANGE"
          ],
          answer: 1,
          explanation: "테이블 구조(열 추가, 수정, 삭제 등)를 변경하는 SQL 표준 DDL 명령어는 'ALTER TABLE'입니다. UPDATE는 테이블 내 데이터 레코드의 값을 수정하는 DML 명령어입니다."
        },
        {
          id: 10,
          subject: "3과목: 데이터베이스 활용",
          question: "릴레이션에서 튜플(Tuple)의 수와 속성(Attribute)의 수를 각각 일컫는 용어로 바르게 짝지어진 것은?",
          options: [
            "차수(Degree) - 카디널리티(Cardinality)",
            "도메인(Domain) - 차수(Degree)",
            "카디널리티(Cardinality) - 차수(Degree)",
            "스키마(Schema) - 인스턴스(Instance)"
          ],
          answer: 2,
          explanation: "튜플(행, 레코드)의 총 개수는 카디널리티(Cardinality), 속성(열, 컬럼)의 총 개수는 차수(Degree)라고 부릅니다. 시험에 매우 빈출되는 기본 개념입니다."
        }
      ]
    },
    {
      id: "safety_2024_01",
      certId: "safety_tech",
      certName: "산업안전산업기사",
      round: "2024년 1회 기출문제 (핵심 선별)",
      totalQuestions: 5,
      timeLimitMinutes: 10,
      questions: [
        {
          id: 1,
          subject: "1과목: 산업안전관리론",
          question: "하인리히(Heinrich)의 재해 구성 비율(1 : 29 : 300의 법칙)에서 300이 의미하는 것은?",
          options: [
            "중상 또는 사망",
            "경상해",
            "무상해 사고 (잠재적 위험/앗차사고)",
            "단순 물적 손실"
          ],
          answer: 2,
          explanation: "하인리히 법칙은 1회의 중상해가 발생할 때 그 이면에 29회의 경상해, 그리고 부상은 없었으나 위험했던 300회의 무상해 사고(Near Miss, 앗차사고)가 존재한다는 통계적 법칙입니다."
        },
        {
          id: 2,
          subject: "1과목: 산업안전관리론",
          question: "연간 근로자 수가 500명이고, 주 40시간 연간 50주를 근무하는 사업장에서 한 해 동안 5건의 재해가 발생하였다. 이때의 도수율(빈도율)은?",
          options: [
            "2.5",
            "5.0",
            "10.0",
            "20.0"
          ],
          answer: 1,
          explanation: "연근로총시간수 = 500명 × 40시간 × 50주 = 1,000,000 시간.\n도수율 = (재해건수 / 연근로총시간수) × 1,000,000 = (5 / 1,000,000) × 1,000,000 = 5.0"
        },
        {
          id: 3,
          subject: "2과목: 인간공학 및 시스템안전공학",
          question: "시스템 안전공학에서 사용하는 결함수 분석법(FTA, Fault Tree Analysis)의 특징에 대한 설명으로 틀린 것은?",
          options: [
            "탑다운(Top-Down) 연역적 해석 기법이다.",
            "논리기호(AND, OR 게이트)를 사용하여 시각적으로 표현한다.",
            "정량적 신뢰도 평가가 불가능하고 정성적 분석만 가능하다.",
            "특정 정점사상(Top Event)에 대한 원인 분석에 효과적이다."
          ],
          answer: 2,
          explanation: "FTA(Fault Tree Analysis)는 정성적 분석뿐만 아니라 최소 컷셋(Minimal Cut Set) 계산 및 기본사상의 고장률을 대입하여 시스템 전체의 실패 확률을 정량적으로도 계산할 수 있는 기법입니다."
        },
        {
          id: 4,
          subject: "3과목: 기계위험방지기술",
          question: "롤러기(Roller)의 급정지장치 중 조작부 위치에 따른 설치 기준으로, 무릎으로 조작하는 방식의 설치 위치는 바닥면으로부터 몇 cm 기준인가?",
          options: [
            "0.4m 이상 0.6m 이내",
            "0.6m 이상 0.8m 이내",
            "0.8m 이상 1.1m 이내",
            "1.8m 이상"
          ],
          answer: 0,
          explanation: "롤러기 급정지장치 조작부 설치 위치:\n- 손 조작식: 바닥면에서 1.8m 이내\n- 복부 조작식: 바닥면에서 0.8m 이상 1.1m 이내\n- 무릎 조작식: 바닥면에서 0.4m 이상 0.6m 이내"
        },
        {
          id: 5,
          subject: "5과목: 건설안전기술",
          question: "건설 현장에서 작업발판의 설치 기준으로 틀린 것은?",
          options: [
            "발판재료는 하중을 견딜 수 있는 견고한 것으로 한다.",
            "작업발판의 폭은 40cm 이상으로 하고, 발판재료 간의 틈은 3cm 이하로 한다.",
            "추락의 위험이 있는 장소에는 안전난간을 설치하지 않아도 된다.",
            "발판재료는 전위(뒤집힘)되거나 탈락하지 않도록 2개소 이상 지지물에 고정한다."
          ],
          answer: 2,
          explanation: "추락 위험이 있는 장소에는 반드시 표준안전난간(상부난간대, 중간난간대, 발끝막이판, 난간기둥)을 의무적으로 설치해야 합니다."
        }
      ]
    }
  ],

  // 3. 기출문제 기반 응용문제 메뉴 데이터 (기출 변형, 복합 신유형, 함정 극복)
  appliedExams: [
    {
      id: "applied_ip_01",
      certId: "info_tech",
      certName: "정보처리산업기사 (기출 응용·심화)",
      title: "기출변형 핵심 응용 모의고사 1탄",
      concept: "기출문제의 핵심 원리를 바탕으로 보기와 조건을 변형한 실전 적응형 문제",
      questions: [
        {
          id: 1,
          subject: "1과목: 정보시스템 기반 기술",
          type: "기출 변형 (교착상태 조건 응용)",
          originalConcept: "교착상태 4대 필요조건 (상호배제, 점유와 대기, 비선점, 환형대기)",
          changePoint: "단순 암기형 보기가 아닌, 시스템 설계 시 교착상태를 '예방(Prevention)'하기 위한 구체적인 구현 방안으로 변형 출제",
          question: "시스템 설계자가 운영체제의 교착상태(Deadlock)를 방지하기 위해 '예방(Prevention)' 기법을 적용하려고 한다. 교착상태 4가지 조건 중 '점유와 대기(Hold and Wait)' 조건을 부정(제거)하기 위한 구체적인 방법으로 가장 적절한 것은?",
          options: [
            "모든 자원에 고유한 일련번호를 부여하고 오름차순으로만 자원을 요청하도록 강제한다.",
            "프로세스가 실행을 시작하기 전에 필요한 모든 자원을 한꺼번에 요청하여 할당받도록 한다.",
            "자원을 요청한 프로세스가 즉시 할당받지 못하면 현재 점유 중인 자원을 강제로 빼앗아 회수한다.",
            "한 번에 여러 프로세스가 공유 자원에 동시에 접근할 수 있도록 동기화를 해제한다."
          ],
          answer: 1,
          explanation: "점유와 대기를 부정하는 방법은 '자원을 점유한 상태에서 다른 자원을 기다리지 못하게' 하는 것입니다. 즉, 프로세스 시작 시 필요한 모든 자원을 사전에 일괄 할당받거나, 추가 자원이 필요할 때 현재 가진 자원을 모두 반납하고 새로 요청하는 방식을 사용합니다.\n- 1번은 환형대기 부정\n- 3번은 비선점 조건 부정"
        },
        {
          id: 2,
          subject: "1과목: 정보시스템 기반 기술",
          type: "기출 변형 (페이지 교체 시뮬레이션)",
          originalConcept: "FIFO 및 LRU 페이지 교체 알고리즘",
          changePoint: "페이지 참조열을 주고 실제 부재(Page Fault) 발생 횟수를 계산하는 실전 계산형 문제로 변형",
          question: "할당된 페이지 프레임 수가 3개인 메모리 시스템에서 다음과 같은 순서로 페이지가 참조될 때, LRU(Least Recently Used) 알고리즘을 적용할 경우 발생하는 총 페이지 부재(Page Fault) 횟수는? (단, 초기 프레임은 비어있음)\n\n참조 순서: 1, 2, 3, 1, 4, 1, 2, 5",
          options: [
            "5회",
            "6회",
            "7회",
            "8회"
          ],
          answer: 1,
          explanation: "단계별 프레임 상태 (최대 3개, LRU):\n1) '1' 참조: [1] (부재 1)\n2) '2' 참조: [1, 2] (부재 2)\n3) '3' 참조: [1, 2, 3] (부재 3)\n4) '1' 참조: [2, 3, 1] (적중)\n5) '4' 참조: 가장 오래 안 쓰인 2 교체 -> [3, 1, 4] (부재 4)\n6) '1' 참조: [3, 4, 1] (적중)\n7) '2' 참조: 가장 오래 안 쓰인 3 교체 -> [4, 1, 2] (부재 5)\n8) '5' 참조: 가장 오래 안 쓰인 4 교체 -> [1, 2, 5] (부재 6)\n총 페이지 부재 횟수는 6회입니다."
        },
        {
          id: 3,
          subject: "2과목: 프로그래밍 언어 활용",
          type: "기출 변형 (포인터 배열과 연산자 우선순위)",
          originalConcept: "C언어 포인터 연산",
          changePoint: "*p++ 와 (*p)++ 의 차이를 묻는 대표적인 함정 코드 추적 문제로 변형",
          question: "다음 C언어 프로그램의 실행 결과로 올바른 것은?\n\n#include <stdio.h>\nint main() {\n    int arr[] = { 10, 20, 30 };\n    int *p = arr;\n    (*p)++;\n    printf(\"%d, \", *p);\n    *p++;\n    printf(\"%d\", *p);\n    return 0;\n}",
          options: [
            "10, 20",
            "11, 20",
            "11, 10",
            "10, 30"
          ],
          answer: 1,
          explanation: "1) (*p)++: 괄호가 우선하므로 p가 가리키는 arr[0]의 값(10)을 1 증가시킵니다. 따라서 arr[0]은 11이 되고, *p 출력 결과는 11입니다.\n2) *p++: 후위 증감 연산자(++)가 포인터 p 자체에 작용하여 p의 주소가 다음 요소 arr[1]을 가리키도록 이동합니다.\n3) 따라서 다음 *p는 arr[1]의 값인 20이 됩니다.\n최종 출력: 11, 20"
        },
        {
          id: 4,
          subject: "2과목: 프로그래밍 언어 활용",
          type: "기출 변형 (파이썬 리스트 컴프리헨션 및 람다)",
          originalConcept: "파이썬 반복문 및 데이터 필터링",
          changePoint: "현업 및 최신 기출에서 자주 등장하는 조건부 리스트 표현식 결과 도출 문제로 변형",
          question: "다음 파이썬 코드의 실행 결과는?\n\nscores = [65, 88, 42, 90, 55, 76]\nresult = [x + 5 for x in scores if x >= 60 and x < 90]\nprint(len(result), sum(result))",
          options: [
            "2, 178",
            "3, 244",
            "3, 229",
            "4, 305"
          ],
          answer: 1,
          explanation: "조건: 60점 이상 90점 미만 필터링\n대상 값: 65, 88, 76 (총 3개)\n각 요소에 +5 적용: [70, 93, 81]\n- 길이 len(result) = 3\n- 합계 sum(result) = 70 + 93 + 81 = 244\n따라서 '3, 244'가 정답입니다."
        },
        {
          id: 5,
          subject: "3과목: 데이터베이스 활용",
          type: "기출 변형 (정규화 역추적 판정)",
          originalConcept: "정규화 단계별 이상 현상 해결",
          changePoint: "특정 함수 종속성 X->Y, Y->Z가 주어졌을 때 이를 해소하기 위한 정규화 단계 판정",
          question: "어느 학생 테이블에서 학번(기본키)이 주어지면 학과코드가 결정되고, 학과코드가 주어지면 학과명이 결정되는 함수 종속 관계(학번 -> 학과코드 -> 학과명)가 존재한다. 이 테이블에서 학과코드의 변경 시 발생하는 갱신 이상을 해결하기 위해 '이행적 함수 종속성(Transitive Functional Dependency)'을 제거하는 정규화 과정은?",
          options: [
            "제1정규형 -> 제2정규형",
            "제2정규형 -> 제3정규형",
            "제3정규형 -> BCNF(보이스-코드 정규형)",
            "BCNF -> 제4정규형"
          ],
          answer: 1,
          explanation: "X -> Y 이고 Y -> Z 일 때 X -> Z 가 성립하는 종속 관계를 '이행적 함수 종속'이라고 합니다. 제2정규형을 만족하는 릴레이션에서 이러한 이행적 함수 종속을 분해하여 제거하는 단계가 바로 '제3정규형(3NF)' 구축 과정입니다."
        },
        {
          id: 6,
          subject: "3과목: 데이터베이스 활용",
          type: "기출 변형 (SQL 집계함수와 HAVING절 함정)",
          originalConcept: "SELECT 문의 WHERE vs HAVING 차이",
          changePoint: "집계함수(COUNT, AVG)를 WHERE 절에 직접 사용하여 문법 오류를 유발하는 빈출 함정 유형 변형",
          question: "다음 중 '급여가 300만원 이상인 직원이 3명 이상 있는 부서'의 부서코드(DeptID)와 직원 수를 조회하는 SQL 문장으로 올바른 것은?",
          options: [
            "SELECT DeptID, COUNT(*) FROM Employee WHERE Salary >= 300 AND COUNT(*) >= 3 GROUP BY DeptID;",
            "SELECT DeptID, COUNT(*) FROM Employee WHERE Salary >= 300 GROUP BY DeptID HAVING COUNT(*) >= 3;",
            "SELECT DeptID, COUNT(*) FROM Employee GROUP BY DeptID HAVING Salary >= 300 AND COUNT(*) >= 3;",
            "SELECT DeptID, COUNT(*) FROM Employee WHERE COUNT(*) >= 3 GROUP BY DeptID HAVING Salary >= 300;"
          ],
          answer: 1,
          explanation: "개별 레코드에 대한 조건(Salary >= 300)은 'WHERE' 절에서 먼저 필터링하고, 그룹핑(GROUP BY DeptID)된 결과에 대한 집계 조건(COUNT(*) >= 3)은 'HAVING' 절에 기술해야 올바른 문법입니다. WHERE 절에는 COUNT(*)와 같은 집계함수를 직접 비교 조건으로 쓸 수 없습니다."
        }
      ]
    },
    {
      id: "applied_safety_01",
      certId: "safety_tech",
      certName: "산업안전산업기사 (기출 응용·심화)",
      title: "산업안전 복합 계산 및 법령 변형 챌린지",
      concept: "종합재해지수 및 위험성 평가 기법의 복합 응용",
      questions: [
        {
          id: 1,
          subject: "1과목: 산업안전관리론",
          type: "기출 변형 (종합재해지수 FSI 계산)",
          originalConcept: "도수율과 강도율",
          changePoint: "도수율과 강도율을 복합하여 종합재해지수를 도출하는 공식 적용 문제로 응용",
          question: "어느 공장의 도수율이 16.0 이고, 강도율이 4.0 일 때, 이 사업장의 종합재해지수(FSI: Frequency Severity Indicator)는 얼마인가?",
          options: [
            "4.0",
            "8.0",
            "10.0",
            "64.0"
          ],
          answer: 1,
          explanation: "종합재해지수(FSI) 공식 = √(도수율 × 강도율) 입니다.\nFSI = √(16.0 × 4.0) = √64 = 8.0"
        },
        {
          id: 2,
          subject: "2과목: 인간공학 및 시스템안전공학",
          type: "기출 변형 (병렬 시스템 신뢰도 복합 연산)",
          originalConcept: "신뢰도 계산 (직렬, 병렬)",
          changePoint: "동일 부품 2개가 병렬 연결된 회로에서 부품 신뢰도가 0.8일 때 시스템 전체의 신뢰도 계산",
          question: "신뢰도가 각각 0.8인 부품 A와 부품 B가 병렬(Parallel) 구조로 연결된 시스템이 있다. 이 시스템 전체의 신뢰도는 얼마인가?",
          options: [
            "0.64",
            "0.80",
            "0.96",
            "0.99"
          ],
          answer: 2,
          explanation: "병렬 시스템 신뢰도 R = 1 - (1 - R1)(1 - R2) 입니다.\n각 부품의 불신뢰도 = 1 - 0.8 = 0.2\n전체 불신뢰도 = 0.2 × 0.2 = 0.04\n시스템 신뢰도 = 1 - 0.04 = 0.96"
        }
      ]
    }
  ]
};

// 브라우저 및 전역 스코프 내보내기
if (typeof window !== 'undefined') {
  window.APP_DATA = APP_DATA;
}
