import { useLms } from "../../data/LmsContext";

export function AdminUsersPage() {
  const { users } = useLms();

  return (
    <section>
      <h2>Users Management</h2>
      <article className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
