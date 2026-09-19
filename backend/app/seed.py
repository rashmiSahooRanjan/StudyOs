import json
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import (
    User, Course, Subject, Topic, Exam, StudySession, ReadingItem, ReadingSession,
    Goal, Task, Question, QuestionAttempt, MockTest, MockAttempt, Revision, Flashcard,
    Mistake, Note, Achievement, DailyReflection
)

def seed_database(app):
    with app.app_context():
        db.create_all()

        # Check or create default master admin (admin / admin)
        admin_user = User.query.filter((User.username == "admin") | (User.email == "admin@studyos.local")).first()
        if not admin_user:
            print("Creating default administrator account (admin / admin)...")
            admin_user = User(
                name="System Administrator",
                username="admin",
                email="admin@studyos.local",
                is_admin=True,
                target_daily_hours=8.0,
                current_streak=0,
                xp=5000,
                level=15
            )
            admin_user.set_password("admin")
            db.session.add(admin_user)
            db.session.commit()

        # Check if database is already seeded with student demo data
        demo_user = User.query.filter_by(email="alex@studyos.local").first()
        if demo_user:
            print("Demo student data already exists, skipping initial seed.")
            return

        print("Seeding StudyOS with comprehensive student demo data...")

        # 1. Primary Student User (Alex Morgan)
        user = User(
            name="Alex Morgan",
            username="alex",
            email="alex@studyos.local",
            is_admin=False,
            target_daily_hours=8.0,
            current_streak=12,
            best_streak=18,
            last_study_date=date.today().strftime("%Y-%m-%d"),
            xp=1840,
            level=8
        )
        user.set_password("studyos123")
        db.session.add(user)
        db.session.flush()

        # 2. Competitive Exam (GATE CSE)
        gate_exam = Exam(
            user_id=user.id,
            name="GATE CSE 2027",
            exam_date=(date.today() + timedelta(days=142)).strftime("%Y-%m-%d"),
            target_score=78.5,
            target_rank=120,
            revision_strategy="spaced_repetition",
            notes="Focus on High weightage subjects: OS, DBMS, Algorithms, and Networks."
        )
        db.session.add(gate_exam)
        db.session.flush()

        # 3. Academic Course
        course = Course(
            user_id=user.id,
            name="B.Tech Computer Science (Final Year)",
            description="Core undergraduate curriculum and competitive exam preparation",
            start_date=(date.today() - timedelta(days=120)).strftime("%Y-%m-%d"),
            target_date=(date.today() + timedelta(days=180)).strftime("%Y-%m-%d"),
            status="active"
        )
        db.session.add(course)
        db.session.flush()

        # 4. Subjects
        sub_os = Subject(
            course_id=course.id,
            exam_id=gate_exam.id,
            name="Operating Systems",
            code="CS-OS",
            color="#3B82F6", # Bright Blue
            icon="Cpu",
            priority="high",
            weightage=1.5
        )
        sub_dbms = Subject(
            course_id=course.id,
            exam_id=gate_exam.id,
            name="Database Management Systems",
            code="CS-DBMS",
            color="#10B981", # Emerald
            icon="Database",
            priority="high",
            weightage=1.4
        )
        sub_cn = Subject(
            course_id=course.id,
            exam_id=gate_exam.id,
            name="Computer Networks",
            code="CS-CN",
            color="#8B5CF6", # Purple
            icon="Network",
            priority="medium",
            weightage=1.2
        )
        sub_algo = Subject(
            course_id=course.id,
            exam_id=gate_exam.id,
            name="Algorithms & Data Structures",
            code="CS-ALGO",
            color="#F59E0B", # Amber
            icon="Code2",
            priority="high",
            weightage=1.6
        )
        sub_compiler = Subject(
            course_id=course.id,
            exam_id=gate_exam.id,
            name="Compiler Design",
            code="CS-CD",
            color="#EC4899", # Pink
            icon="Layers",
            priority="low",
            weightage=0.8
        )
        sub_math = Subject(
            course_id=course.id,
            exam_id=gate_exam.id,
            name="Discrete Mathematics & Calculus",
            code="CS-MATH",
            color="#06B6D4", # Cyan
            icon="Binary",
            priority="high",
            weightage=1.5
        )

        db.session.add_all([sub_os, sub_dbms, sub_cn, sub_algo, sub_compiler, sub_math])
        db.session.flush()

        # 5. Topics (Hierarchical Syllabus from Section 13)
        # OS Topics
        t_os_proc = Topic(subject_id=sub_os.id, name="Processes & Process State Model", status="mastered", completion_pct=100.0, priority="high", estimated_hours=6.0, weightage=1.5)
        t_os_thread = Topic(subject_id=sub_os.id, name="Threads & Concurrency", status="completed", completion_pct=80.0, priority="medium", estimated_hours=4.0, weightage=1.0)
        t_os_sched = Topic(subject_id=sub_os.id, name="CPU Scheduling Algorithms", status="in_progress", completion_pct=70.0, priority="high", estimated_hours=5.0, weightage=1.3)
        t_os_deadlock = Topic(subject_id=sub_os.id, name="Deadlock Avoidance & Banker's Algorithm", status="in_progress", completion_pct=30.0, priority="high", estimated_hours=5.0, weightage=1.4)
        t_os_memory = Topic(subject_id=sub_os.id, name="Memory Management & Paging", status="not_started", completion_pct=0.0, priority="high", estimated_hours=8.0, weightage=1.5)
        db.session.add_all([t_os_proc, t_os_thread, t_os_sched, t_os_deadlock, t_os_memory])

        # DBMS Topics
        t_db_sql = Topic(subject_id=sub_dbms.id, name="Relational Algebra & SQL Queries", status="in_progress", completion_pct=60.0, priority="high", estimated_hours=6.0, weightage=1.2)
        t_db_norm = Topic(subject_id=sub_dbms.id, name="Functional Dependencies & Normalization (BCNF/3NF)", status="in_progress", completion_pct=30.0, priority="high", estimated_hours=7.0, weightage=1.5)
        t_db_trans = Topic(subject_id=sub_dbms.id, name="Transactions & Concurrency Control (2PL, Serializability)", status="not_started", completion_pct=10.0, priority="high", estimated_hours=6.0, weightage=1.3)
        db.session.add_all([t_db_sql, t_db_norm, t_db_trans])

        # CN Topics
        t_cn_tcp = Topic(subject_id=sub_cn.id, name="TCP Congestion & Flow Control", status="in_progress", completion_pct=50.0, priority="medium", estimated_hours=5.0, weightage=1.1)
        t_cn_ip = Topic(subject_id=sub_cn.id, name="IP Subnetting & CIDR Addressing", status="completed", completion_pct=85.0, priority="high", estimated_hours=4.0, weightage=1.2)
        db.session.add_all([t_cn_tcp, t_cn_ip])

        # Algo Topics
        t_algo_dp = Topic(subject_id=sub_algo.id, name="Dynamic Programming & Recurrence Relations", status="in_progress", completion_pct=45.0, priority="high", estimated_hours=10.0, weightage=1.8)
        t_algo_graph = Topic(subject_id=sub_algo.id, name="Graph Algorithms (Dijkstra, Bellman-Ford, MST)", status="completed", completion_pct=90.0, priority="high", estimated_hours=8.0, weightage=1.6)
        db.session.add_all([t_algo_dp, t_algo_graph])
        db.session.flush()

        # 6. Study Sessions (Past few days + today to render realistic dashboard from Section 10)
        today = date.today()
        # Today's sessions: OS (2h 20m), DBMS (1h 40m), Python/Algo (1h 12m), Math (50m) = Total 6h 02m
        s_today1 = StudySession(
            user_id=user.id,
            course_id=course.id,
            exam_id=gate_exam.id,
            subject_id=sub_os.id,
            topic_id=t_os_deadlock.id,
            start_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=9, minutes=0),
            end_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=11, minutes=20),
            duration_minutes=140.0, # 2h 20m
            mode="Revision",
            focus_rating=5,
            distraction_count=1,
            distraction_notes="Water break",
            notes="Mastered Banker's safety algorithm edge cases"
        )
        s_today2 = StudySession(
            user_id=user.id,
            course_id=course.id,
            exam_id=gate_exam.id,
            subject_id=sub_dbms.id,
            topic_id=t_db_norm.id,
            start_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=14, minutes=0),
            end_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=15, minutes=40),
            duration_minutes=100.0, # 1h 40m
            mode="Practice",
            focus_rating=4,
            distraction_count=2,
            distraction_notes="Mobile notifications",
            notes="Practiced 15 functional dependency decomposition questions"
        )
        s_today3 = StudySession(
            user_id=user.id,
            course_id=course.id,
            exam_id=gate_exam.id,
            subject_id=sub_algo.id,
            topic_id=t_algo_dp.id,
            start_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=17, minutes=0),
            end_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=18, minutes=12),
            duration_minutes=72.0, # 1h 12m
            mode="Learning",
            focus_rating=4,
            distraction_count=1,
            notes="Knapsack 0/1 state transitions"
        )
        s_today4 = StudySession(
            user_id=user.id,
            course_id=course.id,
            exam_id=gate_exam.id,
            subject_id=sub_math.id,
            start_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=20, minutes=0),
            end_time=datetime.combine(today, datetime.min.time()) + timedelta(hours=20, minutes=50),
            duration_minutes=50.0, # 50m
            mode="Practice",
            focus_rating=5,
            distraction_count=0,
            notes="Graph isomorphism and group theory theorems"
        )
        db.session.add_all([s_today1, s_today2, s_today3, s_today4])

        # Past days sessions for rich analytics heatmap & Study DNA
        for d_offset in range(1, 15):
            past_date = today - timedelta(days=d_offset)
            sess1 = StudySession(
                user_id=user.id,
                subject_id=sub_os.id if d_offset % 2 == 0 else sub_dbms.id,
                start_time=datetime.combine(past_date, datetime.min.time()) + timedelta(hours=20),
                duration_minutes=60.0 + (d_offset * 10 % 120),
                mode="PYQ",
                focus_rating=4 if d_offset % 3 == 0 else 5,
                distraction_count=1
            )
            sess2 = StudySession(
                user_id=user.id,
                subject_id=sub_algo.id if d_offset % 2 == 1 else sub_cn.id,
                start_time=datetime.combine(past_date, datetime.min.time()) + timedelta(hours=10),
                duration_minutes=90.0,
                mode="Learning",
                focus_rating=4,
                distraction_count=2
            )
            db.session.add_all([sess1, sess2])

        # 7. Goals
        g1 = Goal(user_id=user.id, type="Daily", title="8 Study Hours Daily Target", target_value=8.0, current_value=6.03, unit="hours", period="daily", status="active")
        g2 = Goal(user_id=user.id, type="Daily", title="Solve 30 GATE PYQs", target_value=30.0, current_value=22.0, unit="questions", period="daily", status="active")
        g3 = Goal(user_id=user.id, type="Weekly", title="50 Weekly Study Hours", target_value=50.0, current_value=34.5, unit="hours", period="weekly", status="active")
        g4 = Goal(user_id=user.id, type="Exam", title="Complete GATE CSE High Priority Syllabus", target_value=100.0, current_value=68.0, unit="%", period="custom", status="active")
        db.session.add_all([g1, g2, g3, g4])

        # 8. Tasks (From Section 10 & 17: Today's Priorities)
        t1 = Task(user_id=user.id, subject_id=sub_os.id, title="OS - Deadlock & Banker's Algorithm Revision", due_date=today.strftime("%Y-%m-%d"), priority="high", planned_minutes=60, scheduled_time="19:00 - 20:00", status="completed", actual_minutes=58)
        t2 = Task(user_id=user.id, subject_id=sub_dbms.id, title="DBMS - Normalization Practice (3NF vs BCNF)", due_date=today.strftime("%Y-%m-%d"), priority="high", planned_minutes=90, scheduled_time="20:15 - 21:45", status="in_progress", actual_minutes=91)
        t3 = Task(user_id=user.id, subject_id=sub_os.id, title="GATE PYQ - 30 Questions Practice Session", due_date=today.strftime("%Y-%m-%d"), priority="medium", planned_minutes=45, scheduled_time="22:00 - 22:30", status="pending")
        t4 = Task(user_id=user.id, subject_id=sub_cn.id, title="Computer Networks - TCP Congestion Window Analysis", due_date=(today + timedelta(days=1)).strftime("%Y-%m-%d"), priority="medium", planned_minutes=60, scheduled_time="11:00 - 12:00", status="pending")
        db.session.add_all([t1, t2, t3, t4])

        # 9. PYQ Questions (Real GATE CSE questions)
        q1 = Question(
            exam_id=gate_exam.id,
            subject_id=sub_os.id,
            topic_id=t_os_deadlock.id,
            year=2023,
            difficulty="Medium",
            question_text="Consider a system with 3 processes P1, P2, P3 and 12 units of a resource R. P1 requires 10 units, P2 requires 4 units, and P3 requires 9 units. Current allocation is 5, 2, and 2 respectively. What is the state of the system according to Banker's Algorithm?",
            options_json=json.dumps([
                "Safe state with execution sequence <P2, P1, P3>",
                "Safe state with execution sequence <P2, P3, P1>",
                "Unsafe state (Deadlock imminent)",
                "Deadlocked state already occurred"
            ]),
            answer="Safe state with execution sequence <P2, P1, P3>",
            explanation="Available resources = 12 - (5+2+2) = 3 units. Remaining needs: P1=5, P2=2, P3=7. Only P2 can be satisfied with 3 units. Once P2 finishes, available = 3 + 2 = 5. Now P1 (needs 5) can execute. Once P1 finishes, available = 10, so P3 can execute.",
            marks=2.0,
            negative_marks=0.66,
            source="GATE CSE 2023"
        )
        q2 = Question(
            exam_id=gate_exam.id,
            subject_id=sub_dbms.id,
            topic_id=t_db_norm.id,
            year=2022,
            difficulty="Hard",
            question_text="Relation R(A, B, C, D) has functional dependencies: A -> B, B -> C, C -> D, D -> A. What is the highest normal form satisfied by relation R?",
            options_json=json.dumps(["1NF", "2NF", "3NF", "BCNF"]),
            answer="BCNF",
            explanation="All attributes are candidate keys: {A}, {B}, {C}, {D}. For every functional dependency X -> Y, the determinant X is a superkey. Hence, R satisfies Boyce-Codd Normal Form (BCNF).",
            marks=2.0,
            negative_marks=0.66,
            source="GATE CSE 2022"
        )
        q3 = Question(
            exam_id=gate_exam.id,
            subject_id=sub_cn.id,
            topic_id=t_cn_ip.id,
            year=2021,
            difficulty="Easy",
            question_text="In IPv4 addressing, which classless subnet mask represents a block of 64 contiguous host addresses?",
            options_json=json.dumps(["/24", "/26", "/27", "/28"]),
            answer="/26",
            explanation="A /26 subnet leaves 32 - 26 = 6 bits for host IDs. 2^6 = 64 total addresses (62 usable host addresses).",
            marks=1.0,
            negative_marks=0.33,
            source="GATE CSE 2021"
        )
        q4 = Question(
            exam_id=gate_exam.id,
            subject_id=sub_os.id,
            topic_id=t_os_sched.id,
            year=2024,
            difficulty="Medium",
            question_text="Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?",
            options_json=json.dumps(["First Come First Served (FCFS)", "Shortest Job First (SJF / SRTF)", "Round Robin (RR)", "Priority Scheduling"]),
            answer="Shortest Job First (SJF / SRTF)",
            explanation="SJF is provably optimal in terms of minimizing average waiting time by scheduling shorter jobs ahead of longer jobs.",
            marks=1.0,
            negative_marks=0.33,
            source="GATE CSE 2024"
        )
        db.session.add_all([q1, q2, q3, q4])
        db.session.flush()

        # 10. Question Attempts
        att1 = QuestionAttempt(question_id=q1.id, user_id=user.id, selected_answer="Safe state with execution sequence <P2, P1, P3>", correct=True, time_taken_seconds=95)
        att2 = QuestionAttempt(question_id=q2.id, user_id=user.id, selected_answer="3NF", correct=False, time_taken_seconds=120)
        att3 = QuestionAttempt(question_id=q3.id, user_id=user.id, selected_answer="/26", correct=True, time_taken_seconds=30)
        db.session.add_all([att1, att2, att3])

        # 11. Mistake Book (Section 21 - Wrong answer logged with diagnostic reason)
        m1 = Mistake(
            user_id=user.id,
            question_id=q2.id,
            subject_id=sub_dbms.id,
            topic_id=t_db_norm.id,
            user_answer="3NF",
            correct_answer="BCNF",
            reason="concept gap",
            concept_note="Forgot that when circular functional dependencies exist (A->B->C->D->A), every single attribute becomes an individual candidate key!",
            reviewed=False,
            reattempted=False,
            last_result="unresolved"
        )
        db.session.add(m1)

        # 12. Spaced Revisions (Section 10 & 20: 2 revisions overdue/due today)
        rev1 = Revision(
            user_id=user.id,
            topic_id=t_os_deadlock.id,
            due_date=(today - timedelta(days=1)).strftime("%Y-%m-%d"), # Overdue by 1 day
            status="pending",
            interval_days=3,
            stage=2
        )
        rev2 = Revision(
            user_id=user.id,
            topic_id=t_db_norm.id,
            due_date=today.strftime("%Y-%m-%d"), # Due today
            status="pending",
            interval_days=1,
            stage=1
        )
        rev3 = Revision(
            user_id=user.id,
            topic_id=t_algo_graph.id,
            due_date=(today + timedelta(days=5)).strftime("%Y-%m-%d"), # Upcoming
            status="pending",
            interval_days=7,
            stage=3
        )
        db.session.add_all([rev1, rev2, rev3])

        # 13. Flashcards
        fc1 = Flashcard(
            user_id=user.id,
            subject_id=sub_os.id,
            topic_id=t_os_deadlock.id,
            front="What are the 4 Coffman conditions required for a Deadlock to occur?",
            back="1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait (All 4 must hold simultaneously!)",
            difficulty="medium",
            reviews_count=2,
            interval_days=3
        )
        fc2 = Flashcard(
            user_id=user.id,
            subject_id=sub_dbms.id,
            topic_id=t_db_norm.id,
            front="What is the strict difference between 3NF and BCNF?",
            back="In BCNF, for EVERY non-trivial dependency X -> Y, X MUST be a superkey. 3NF allows an exception if Y is a prime attribute (part of any candidate key).",
            difficulty="hard",
            reviews_count=1,
            interval_days=1
        )
        db.session.add_all([fc1, fc2])

        # 14. Mock Test & Attempt (Section 19: Mock Test #12 with section breakdown)
        mock1 = MockTest(
            exam_id=gate_exam.id,
            title="GATE CSE Full Length Mock #12",
            total_marks=100.0,
            duration_minutes=180,
            total_questions=65,
            sections_json=json.dumps([
                {"name": "OS", "marks": 15},
                {"name": "DBMS", "marks": 15},
                {"name": "CN", "marks": 12},
                {"name": "TOC", "marks": 10},
                {"name": "COA", "marks": 12},
                {"name": "Math", "marks": 15},
                {"name": "General Aptitude", "marks": 15}
            ])
        )
        db.session.add(mock1)
        db.session.flush()

        mock_attempt1 = MockAttempt(
            mock_id=mock1.id,
            user_id=user.id,
            score=62.0,
            total_marks=100.0,
            correct_count=42,
            wrong_count=15,
            skipped_count=8,
            time_taken_minutes=167.0, # 2h 47m
            section_breakdown_json=json.dumps({
                "OS": 82.0,
                "DBMS": 76.0,
                "CN": 71.0,
                "TOC": 55.0,
                "COA": 63.0,
                "Math": 81.0
            }),
            attempted_at=datetime.utcnow() - timedelta(days=2)
        )
        db.session.add(mock_attempt1)

        # 15. Reading Tracker (Section 15: Books & PDFs)
        r1 = ReadingItem(
            user_id=user.id,
            title="Operating System Concepts (Silberschatz)",
            type="Book",
            author="Silberschatz, Galvin, Gagne",
            total_pages=940,
            current_page=380,
            status="reading",
            cover_color="#2563EB"
        )
        r2 = ReadingItem(
            user_id=user.id,
            title="Database System Concepts",
            type="Book",
            author="Abraham Silberschatz, Henry Korth",
            total_pages=850,
            current_page=420,
            status="reading",
            cover_color="#059669"
        )
        r3 = ReadingItem(
            user_id=user.id,
            title="Computer Networks: A Systems Approach",
            type="PDF",
            author="Larry Peterson & Bruce Davie",
            total_pages=620,
            current_page=190,
            status="reading",
            cover_color="#7C3AED"
        )
        db.session.add_all([r1, r2, r3])
        db.session.flush()

        rs1 = ReadingSession(reading_item_id=r1.id, pages_read=24, duration_minutes=45.0, start_page=356, end_page=380)
        rs2 = ReadingSession(reading_item_id=r2.id, pages_read=18, duration_minutes=35.0, start_page=402, end_page=420)
        db.session.add_all([rs1, rs2])

        # 16. Notes (Section 22)
        n1 = Note(
            user_id=user.id,
            subject_id=sub_os.id,
            topic_id=t_os_deadlock.id,
            title="Banker's Algorithm Quick Cheatsheet",
            content="""# Banker's Algorithm Safety Formula

1. **Need Matrix** = `Max - Allocation`
2. **Safety Check**: Find process `Pi` such that:
   `Need[i] <= Available`
3. If found:
   `Available = Available + Allocation[i]`
   Add `Pi` to safe sequence.
4. If all processes finish, state is **SAFE** and deadlock-free!""",
            tags="os,deadlock,formulas,gate",
            pinned=True
        )
        n2 = Note(
            user_id=user.id,
            subject_id=sub_dbms.id,
            topic_id=t_db_norm.id,
            title="3NF vs BCNF Synthesis Steps",
            content="""# Canonical Cover & Synthesis

1. Find Canonical Cover `Fc` (minimal cover)
2. Create relations for each FD in `Fc`
3. If no candidate key is contained in any created relation, create a relation with any candidate key.
4. Eliminate redundant relations (subsets).""",
            tags="dbms,normalization,gate",
            pinned=False
        )
        db.session.add_all([n1, n2])

        # 17. Achievements
        a1 = Achievement(user_id=user.id, badge_key="first_session", title="First Step", description="Completed your very first focus study session!", icon="Zap", category="Milestone")
        a2 = Achievement(user_id=user.id, badge_key="streak_7", title="Iron Will", description="Achieved a 7-day study streak!", icon="Flame", category="Streak")
        a3 = Achievement(user_id=user.id, badge_key="study_10h", title="Deep Diver", description="Logged more than 10 hours of focused study!", icon="Clock", category="Hours")
        db.session.add_all([a1, a2, a3])

        db.session.commit()
        print("Database successfully seeded with realistic student data!")

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    seed_database(app)
