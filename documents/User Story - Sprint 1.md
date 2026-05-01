1.  **USER STORY: LOG IN**

2.  

+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Card**          | As a Student/Teacher/Admin                                                                                                      |
|                   |                                                                                                                                 |
|                   | I want to log in to the system using my Gmail and password                                                                      |
|                   |                                                                                                                                 |
|                   | So that I can access system features based on my assigned role                                                                  |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Summary**       | Allows authorized users to log in according to their role to the NP Education system.                                           |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **In-Scope:**     | - Email & password authentication                                                                                               |
|                   |                                                                                                                                 |
|                   | <!-- -->                                                                                                                        |
|                   |                                                                                                                                 |
|                   | - Role-based redirection after login                                                                                            |
|                   |                                                                                                                                 |
|                   | - Error message for invalid login                                                                                               |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Out of scope**  | - Social login (Google)                                                                                                         |
|                   |                                                                                                                                 |
|                   | - Two-factor authentication                                                                                                     |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Trigger**       | User clicks the \"Đăng nhập\" button with Email and password.                                                                   |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Pre-condition** | - User already has a registered account in the system                                                                           |
|                   |                                                                                                                                 |
|                   | - User account is active                                                                                                        |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Business rule   | - Email and password fields cannot be empty; if empty, show: "Email hoặc số điện thoại không hợp lệ."                           |
| and error         |                                                                                                                                 |
| message**         | - Email must exist in the database                                                                                              |
|                   |                                                                                                                                 |
|                   | - Password must match the encrypted password                                                                                    |
|                   |                                                                                                                                 |
|                   | - If password incorrect → show: "Mật khẩu sai. Vui lòng nhập lại."                                                              |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Screen design** | ![](media/image11.png){width="4.104166666666667in" height="2.5972222222222223in"}                                               |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Screen          |   ----------------------------------------------------------------------------------------------------------------------------- |
| description**     |   **\             **Description**                             **Type**       **Min**   **Max**   **Maxlength**   **Required**   |
|                   |   Name**                                                                                                                        |
|                   |   --------------- ------------------------------------------- -------------- --------- --------- --------------- -------------- |
|                   |   Tên tài khoản   Account email                               varchar(255)   4         10        10              Yes            |
|                   |                                                                                                                                 |
|                   |   Mật khẩu        Password (hidden characters)                varchar(255)   8         30        30              Yes            |
|                   |                                                                                                                                 |
|                   |   Quên mật khẩu   Redirects user to the reset password page   link                                               No             |
|                   |                                                                                                                                 |
|                   |   Đăng nhập       Submits login information to the system     button                                             Yes            |
|                   |   ----------------------------------------------------------------------------------------------------------------------------- |
+-------------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Acceptance      | - If login information is correct →                                                                                             |
| Criteria**        |                                                                                                                                 |
|                   |   - student is redirected to the student dashboard including features: this week's schedule, upcoming classes                   |
|                   |                                                                                                                                 |
|                   |   - teacher is redirected to the teaching schedule page, also showing: "The next class to be taught."                           |
|                   |                                                                                                                                 |
|                   |   - admin is redirected to the teaching admin dashboard, showing: total number of students, active                              |
|                   |                                                                                                                                 |
|                   | - System validates the login credentials.                                                                                       |
|                   |                                                                                                                                 |
|                   | <!-- -->                                                                                                                        |
|                   |                                                                                                                                 |
|                   | - Invalid login shows an error message                                                                                          |
|                   |                                                                                                                                 |
|                   | - The system prevents login with empty fields                                                                                   |
+===================+=================================================================================================================================+

3.  **USER STORY: RESET PASSWORD**

+-------------------+------------------------------------------------------------------------------------------------+
| **Card**          | > As a teacher/student                                                                         |
|                   | >                                                                                              |
|                   | > I want to reset my password if I forget it\                                                  |
|                   | > So that I can regain access to my account                                                    |
+-------------------+------------------------------------------------------------------------------------------------+
| **Summary**       | Allows users to securely reset their passwords via email verification.                         |
+-------------------+------------------------------------------------------------------------------------------------+
| **In-Scope:**     | - Request password reset                                                                       |
|                   |                                                                                                |
|                   | - User verification (email link)                                                               |
|                   |                                                                                                |
|                   | - Reset password (enter new password)                                                          |
+-------------------+------------------------------------------------------------------------------------------------+
| **Out of scope**  | - SMS verification                                                                             |
|                   |                                                                                                |
|                   | - OTP verification                                                                             |
|                   |                                                                                                |
|                   | - Security question recovery                                                                   |
+-------------------+------------------------------------------------------------------------------------------------+
| **Trigger**       | User clicks the "Forgot Password" link on the login page.                                      |
+-------------------+------------------------------------------------------------------------------------------------+
| **Pre-condition** | - Email must exist in the database                                                             |
|                   |                                                                                                |
|                   | - User account must be active                                                                  |
+-------------------+------------------------------------------------------------------------------------------------+
| **Business rule   | - Email must be in a valid format. If email not found or invalid → show: "Vui long nhập email  |
| and error         |   hợp lệ ."                                                                                    |
| message**         |                                                                                                |
|                   | - New password must:                                                                           |
|                   |                                                                                                |
|                   | <!-- -->                                                                                       |
|                   |                                                                                                |
|                   | - Minimum 8 characters                                                                         |
|                   |                                                                                                |
|                   | - Contain at least 1 number                                                                    |
|                   |                                                                                                |
|                   | <!-- -->                                                                                       |
|                   |                                                                                                |
|                   | - If passwords do not match → "Mật khẩu không trùng khớp. Vui lòng nhập lại"                   |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen design** | ![](media/image8.png){width="4.104166666666667in" height="2.5972222222222223in"}               |
|                   |                                                                                                |
|                   | ![](media/image7.png){width="4.104166666666667in" height="2.5972222222222223in"}               |
|                   |                                                                                                |
|                   | ![](media/image9.png){width="4.104166666666667in" height="2.5972222222222223in"}               |
|                   |                                                                                                |
|                   | ![](media/image10.png){width="4.104166666666667in" height="2.5972222222222223in"}              |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen          |   -------------------------------------------------------------------------------------------- |
| description**     |   **\      **Description**   **Type**       **Min**   **Max**   **Maxlength**   **Required**   |
|                   |   Name**                                                                                       |
|                   |   -------- ----------------- -------------- --------- --------- --------------- -------------- |
|                   |   Email    Registered email  varchar(255)   15        30        10              Yes            |
|                   |            address                                                                             |
|                   |                                                                                                |
|                   |   Mật khẩu New password      varchar(255)   8         30        30              Yes            |
|                   |   mới      created by user                                                                     |
|                   |                                                                                                |
|                   |   Xác nhận Re-enter password varchar(255)   8         30        30              Yes            |
|                   |   mật khẩu                                                                                     |
|                   |   mới                                                                                          |
|                   |   -------------------------------------------------------------------------------------------- |
+-------------------+------------------------------------------------------------------------------------------------+
| **Acceptance      | - System validates the email format.                                                           |
| Criteria**        |                                                                                                |
|                   | - System displays an error message if the email format is invalid.                             |
|                   |                                                                                                |
|                   | - System sends a password reset request after a valid email is submitted.                      |
|                   |                                                                                                |
|                   | - System updates the password successfully when the new password is valid.                     |
+===================+================================================================================================+

4.  **USER STORY: VIEW CLASS SCHEDULE**

+-------------------+------------------------------------------------------------------------------------------------+
| **Card**          | - As a student                                                                                 |
|                   |                                                                                                |
|                   | - I want to view my class schedule                                                             |
|                   |                                                                                                |
|                   | - So that I know when my classes take place                                                    |
+-------------------+------------------------------------------------------------------------------------------------+
| **Summary**       | Allows students to view their personal class schedule in a weekly calendar format, including   |
|                   | course name, time, classroom, and class type.                                                  |
+-------------------+------------------------------------------------------------------------------------------------+
| **In-Scope:**     | - Students can view their weekly class schedule in the system.                                 |
|                   |                                                                                                |
|                   | - Students can navigate between weeks (previous week / next week).                             |
+-------------------+------------------------------------------------------------------------------------------------+
| **Out of scope**  | - Students cannot edit schedule.                                                               |
|                   |                                                                                                |
|                   | - Students cannot create classes.                                                              |
|                   |                                                                                                |
|                   | - Students cannot modify class information.                                                    |
|                   |                                                                                                |
|                   | - Students cannot view schedules of other students.                                            |
+-------------------+------------------------------------------------------------------------------------------------+
| **Trigger**       | Student opens the schedule page after login                                                    |
+-------------------+------------------------------------------------------------------------------------------------+
| **Pre-condition** | - Student must be logged in                                                                    |
|                   |                                                                                                |
|                   | - Student must be enrolled in at least one class                                               |
|                   |                                                                                                |
|                   | - Class schedule data must exist in the system                                                 |
+-------------------+------------------------------------------------------------------------------------------------+
| **Business rule   | - Students can only view schedules of their enrolled classes.                                  |
| and error         |                                                                                                |
| message**         | - Schedules are displayed in weekly calendar format by default.                                |
|                   |                                                                                                |
|                   | - Each class event shows class name, time, and room.                                           |
|                   |                                                                                                |
|                   | - Colors indicate class type (Theory / Practice / Test).                                       |
|                   |                                                                                                |
|                   | - If no schedule -\> "No schedule available".                                                  |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen design** | ![](media/image3.png){width="4.104166666666667in" height="4.263888888888889in"}                |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen          |   -------------------------------------------------------------------------------------------- |
| description**     |   **\      **Description**   **Type**       **Min**   **Max**   **Maxlength**   **Required**   |
|                   |   Name**                                                                                       |
|                   |   -------- ----------------- -------------- --------- --------- --------------- -------------- |
|                   |   Tên lớp  Name of the       varchar(255)   1         30        30              yes            |
|                   |            course                                                                              |
|                   |                                                                                                |
|                   |   Thời     Class start and   time           \-        \-        \-              yes            |
|                   |   gian     end time                                                                            |
|                   |                                                                                                |
|                   |   Lớp      Room where class  varchar(255)   1         10        10              yes            |
|                   |            takes place                                                                         |
|                   |   -------------------------------------------------------------------------------------------- |
+-------------------+------------------------------------------------------------------------------------------------+
| **Acceptance      | - System displays the weekly class schedule.                                                   |
| Criteria**        |                                                                                                |
+===================+================================================================================================+

5.  **USER STORY: ACCESS LEARNING MATERIALS**

+-------------------+--------------------------------------------------------------------------------------------------+
| **Card**          | - As a student                                                                                   |
|                   |                                                                                                  |
|                   | - I want to access learning materials                                                            |
|                   |                                                                                                  |
|                   | - So that I can review and study lessons anytime.                                                |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Summary**       | Allows students to access learning materials such as lecture documents, videos, and slides to    |
|                   | support their learning process.                                                                  |
+-------------------+--------------------------------------------------------------------------------------------------+
| **In-Scope:**     | - Students can view a list of learning materials in the system.                                  |
|                   |                                                                                                  |
|                   | - Students can preview learning materials.                                                       |
|                   |                                                                                                  |
|                   | - Students can download learning materials.                                                      |
|                   |                                                                                                  |
|                   | - Students can watch video lessons directly in the system.                                       |
|                   |                                                                                                  |
|                   | - Students can start quizzes or assignments from the materials page.                             |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Out of scope**  | - Students cannot upload materials.                                                              |
|                   |                                                                                                  |
|                   | - Students cannot edit learning materials.                                                       |
|                   |                                                                                                  |
|                   | - Students cannot delete materials.                                                              |
|                   |                                                                                                  |
|                   | - Students cannot access materials of other courses they are not enrolled in.                    |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Trigger**       | Student opens the Learning Materials page after login                                            |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Pre-condition** | - Student must be logged in.                                                                     |
|                   |                                                                                                  |
|                   | - Student must be enrolled in the course.                                                        |
|                   |                                                                                                  |
|                   | - Learning materials must exist in the system.                                                   |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Business rule   | - Students can only access materials of courses they are enrolled in.                            |
| and error         |                                                                                                  |
| message**         | - Materials are categorized by type (PDF, Video, Slide).                                         |
|                   |                                                                                                  |
|                   | - Students can download documents and slides.                                                    |
|                   |                                                                                                  |
|                   | - If no materials available -\> show "No learning material available."                           |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Screen design** | ![](media/image4.png){width="4.104166666666667in" height="3.4722222222222223in"}                 |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Screen          |   ---------------------------------------------------------------------------------------------- |
| description**     |   **\        **Description**   **Type**       **Min**   **Max**   **Maxlength**   **Required**   |
|                   |   Name**                                                                                         |
|                   |   ---------- ----------------- -------------- --------- --------- --------------- -------------- |
|                   |   Tìm kiếm   Search learning   varchar(255)   \-        \-        100             no             |
|                   |              materials                                                                           |
|                   |                                                                                                  |
|                   |   Tên tài    Name of learning  varchar(255)   1         200       200             yes            |
|                   |   liệu       material                                                                            |
|                   |                                                                                                  |
|                   |   Loại tài   Type of material  label          \-        \-        \-              yes            |
|                   |   liệu       (PDF, Video,                                                                        |
|                   |              Slide)                                                                              |
|                   |                                                                                                  |
|                   |   Download   Download material button         \-        \-        \-              no             |
|                   |              file                                                                                |
|                   |                                                                                                  |
|                   |   Preview    Preview material  button         \-        \-        \-              no             |
|                   |                                                                                                  |
|                   |   Xem video  Play video lesson butoon         \-        \-        \-              no             |
|                   |   ---------------------------------------------------------------------------------------------- |
+-------------------+--------------------------------------------------------------------------------------------------+
| **Acceptance      | - System displays a list of available learning materials.                                        |
| Criteria**        |                                                                                                  |
|                   | - Student can preview learning materials.                                                        |
|                   |                                                                                                  |
|                   | - Student can download documents and slides.                                                     |
|                   |                                                                                                  |
|                   | - Student can watch video lessons directly.                                                      |
+===================+==================================================================================================+

6.  **USER STORY: CREATE A USER ACCOUNT**

+-------------------+------------------------------------------------------------------------------------------------+
| **Card**          | - As an admin                                                                                  |
|                   |                                                                                                |
|                   | - I want to create user accounts                                                               |
|                   |                                                                                                |
|                   | - So that students and teachers can access the system.                                         |
+-------------------+------------------------------------------------------------------------------------------------+
| **Summary**       | Allows the admin to create an account users, including students and teachers.                  |
+-------------------+------------------------------------------------------------------------------------------------+
| **In-Scope:**     | - View list of users (students, teachers, staff)                                               |
|                   |                                                                                                |
|                   | - Search users by name, email, or ID                                                           |
|                   |                                                                                                |
|                   | - Filter users by class or level                                                               |
|                   |                                                                                                |
|                   | - Create a new user account                                                                    |
|                   |                                                                                                |
|                   | - Display user information (name, contact, role, status)                                       |
|                   |                                                                                                |
|                   | - Lock or unlock user accounts                                                                 |
+-------------------+------------------------------------------------------------------------------------------------+
| **Out of scope**  | - User self-registration                                                                       |
+-------------------+------------------------------------------------------------------------------------------------+
| **Trigger**       | The student clicks the "User management" to access the user account management page and clicks |
|                   | "Create new user" to add a new user.                                                           |
+-------------------+------------------------------------------------------------------------------------------------+
| **Pre-condition** | - Admin must be logged in.                                                                     |
+-------------------+------------------------------------------------------------------------------------------------+
| **Business rule   | - Role must be selected before saving the user.                                                |
| and error         |                                                                                                |
| message**         | - Full name cannot be empty.                                                                   |
|                   |                                                                                                |
|                   | - Email must be in a valid format.                                                             |
|                   |                                                                                                |
|                   | - Email must be unique in the system.                                                          |
|                   |                                                                                                |
|                   | - Phone number must be valid.                                                                  |
|                   |                                                                                                |
|                   | - Password must contain at least 8 characters including letters and numbers.                   |
|                   |                                                                                                |
|                   | - If required fields are missing, the system shows an error message.                           |
|                   |                                                                                                |
|                   | - If email already exists, system shows: \"Email đã tồn tại.\"                                 |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen design** | ![](media/image1.png){width="4.104166666666667in"                                              |
|                   | height="3.2916666666666665in"}![](media/image5.png){width="4.104166666666667in"                |
|                   | height="3.3055555555555554in"}                                                                 |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen          |   -------------------------------------------------------------------------------------------- |
| description**     |   **\      **Description**   **Type**       **Min**   **Max**   **Maxlength**   **Required**   |
|                   |   Name**                                                                                       |
|                   |   -------- ----------------- -------------- --------- --------- --------------- -------------- |
|                   |   Vai trò  Select the role   Dropdown       \-        \-        \-              no             |
|                   |            of the new user                                                                     |
|                   |            (Student,                                                                           |
|                   |            Teacher, Staff)                                                                     |
|                   |                                                                                                |
|                   |   Họ tên   Enter the full    varchar(255)   1         200       200             yes            |
|                   |            name of the user                                                                    |
|                   |                                                                                                |
|                   |   Ngày     Select the        date           \-        \-        \-              no             |
|                   |   sinh     user\'s date of                                                                     |
|                   |            birth                                                                               |
|                   |                                                                                                |
|                   |   Email    Enter the email   text           5         100       100             yes            |
|                   |            used for login                                                                      |
|                   |                                                                                                |
|                   |   Số điện  Enter the user\'s text           10        11        11              yes            |
|                   |   thoại    phone number                                                                        |
|                   |                                                                                                |
|                   |   Mật khẩu Enter password    varchar(255)   8         20        20              yes            |
|                   |            for the new                                                                         |
|                   |            account                                                                             |
|                   |                                                                                                |
|                   |   Hủy      Cancel adding a   Button         \-        \-        \-              no             |
|                   |            new user and                                                                        |
|                   |            close the form                                                                      |
|                   |                                                                                                |
|                   |   Lưu      Save the new user Button         \-        \-        \-              no             |
|                   |            information to                                                                      |
|                   |            the system                                                                          |
|                   |   -------------------------------------------------------------------------------------------- |
+-------------------+------------------------------------------------------------------------------------------------+
| **Acceptance      | - System validates required fields before saving.                                              |
| Criteria**        |                                                                                                |
|                   | - System displays an error message if required fields are missing or invalid.                  |
|                   |                                                                                                |
|                   | - System creates a new user account successfully when valid information is submitted.          |
+===================+================================================================================================+

7.  **USER STORY: CREATE CLASSES**

+-------------------+------------------------------------------------------------------------------------------------+
| **Card**          | - As an admin                                                                                  |
|                   |                                                                                                |
|                   | - I want to create classes                                                                     |
|                   |                                                                                                |
|                   | - So that the courses are organized properly.                                                  |
+-------------------+------------------------------------------------------------------------------------------------+
| **Summary**       | Allows the admin to create new classes                                                         |
+-------------------+------------------------------------------------------------------------------------------------+
| **In-Scope:**     | - Admin can create a new class.                                                                |
|                   |                                                                                                |
|                   | - Admin can assign a course to a class.                                                        |
|                   |                                                                                                |
|                   | - Admin can assign a teacher to a class.                                                       |
|                   |                                                                                                |
|                   | - Admin can set the maximum number of students in a class.                                     |
|                   |                                                                                                |
|                   | - Admin can set class schedule and session time.\                                              |
|                   |   Admin can assign a classroom.                                                                |
+-------------------+------------------------------------------------------------------------------------------------+
| **Out of scope**  | - Admin cannot register students into classes in this function.                                |
+-------------------+------------------------------------------------------------------------------------------------+
| **Trigger**       | Student opens the Class Management page from the system menu after login                       |
+-------------------+------------------------------------------------------------------------------------------------+
| **Pre-condition** | - Admin must be logged into the system.                                                        |
|                   |                                                                                                |
|                   | - Courses must exist in the system.                                                            |
|                   |                                                                                                |
|                   | - Teachers must exist in the system.                                                           |
|                   |                                                                                                |
|                   | - Classrooms must exist in the system.                                                         |
+-------------------+------------------------------------------------------------------------------------------------+
| **Business rule   | - Each class must belong to one course.                                                        |
| and error         |                                                                                                |
| message**         | - Each class must have one assigned teacher.                                                   |
|                   |                                                                                                |
|                   | - The maximum number of students must be greater than 0.                                       |
|                   |                                                                                                |
|                   | - Class code must be unique in the system.                                                     |
|                   |                                                                                                |
|                   | - Class schedule must not conflict with the teacher's existing schedule.                       |
|                   |                                                                                                |
|                   | - Empty required field -\> \"Không được để trống mục này.\"                                    |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen design** | ![](media/image2.png){width="4.104166666666667in"                                              |
|                   | height="3.3055555555555554in"}![](media/image6.png){width="4.104166666666667in"                |
|                   | height="3.375in"}                                                                              |
+-------------------+------------------------------------------------------------------------------------------------+
| **Screen          |   -------------------------------------------------------------------------------------------- |
| description**     |   **\      **Description**   **Type**       **Min**   **Max**   **Maxlength**   **Required**   |
|                   |   Name**                                                                                       |
|                   |   -------- ----------------- -------------- --------- --------- --------------- -------------- |
|                   |   Khóa học Select course for Dropdown       \-        \-        \-              Yes            |
|                   |            the class                                                                           |
|                   |                                                                                                |
|                   |   Mã lớp   Enter unique      varchar(255)   2         20        20              yes            |
|                   |            class code                                                                          |
|                   |                                                                                                |
|                   |   Tên lớp  Enter class       varchar(255)   2         100       100             yes            |
|                   |            display name                                                                        |
|                   |                                                                                                |
|                   |   Giáo     Select teacher    Dropdown       \-        \-        \-              yes            |
|                   |   viên     responsible for                                                                     |
|                   |            the class                                                                           |
|                   |                                                                                                |
|                   |   Ngày bắt Select class      Date           \-        \-        \-              yes            |
|                   |   đầu      start date                                                                          |
|                   |                                                                                                |
|                   |   Ca học   Select class      Dropdown       \-        \-        \-              yes            |
|                   |            session time                                                                        |
|                   |                                                                                                |
|                   |   Hủy      Cancel class      Button         \-        \-        \-              yes            |
|                   |            creation                                                                            |
|                   |                                                                                                |
|                   |   Lưu      Save class        Button         \-        \-        \-              yes            |
|                   |            information                                                                         |
|                   |   -------------------------------------------------------------------------------------------- |
+-------------------+------------------------------------------------------------------------------------------------+
| **Acceptance      | - Admin can enter class information, including course, teacher, schedule, and classroom.       |
| Criteria**        |                                                                                                |
|                   | - System validates all required fields before saving.                                          |
|                   |                                                                                                |
|                   | - System prevents duplicate class codes.                                                       |
|                   |                                                                                                |
|                   | - System saves the class successfully when all inputs are valid.                               |
+===================+================================================================================================+
